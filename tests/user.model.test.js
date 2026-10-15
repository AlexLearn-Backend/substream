import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import User from '../models/user.model.js';

const originalPassword = 'original-password';
const originalHash = await bcrypt.hash(originalPassword, 4);
const userData = (overrides = {}) => ({
  name: 'Test User', email: 'test@example.com', password: originalPassword, ...overrides
});
let writes;

beforeEach(() => {
  writes = [];
  for (const method of ['insertOne', 'updateOne', 'updateMany', 'findOneAndUpdate',
    'replaceOne', 'findOneAndReplace', 'insertMany', 'bulkWrite']) {
    mock.method(User.collection, method, async (...args) => {
      writes.push({ method, args });
      return { acknowledged: true, insertedId: args[0]._id, matchedCount: 1, modifiedCount: 1 };
    });
  }
});
afterEach(() => mock.restoreAll());

for (const method of ['save', 'create']) {
  test(`${method} persists a bcrypt hash`, async () => {
    const user = method === 'save' ? await new User(userData()).save() : await User.create(userData());

    assert.equal(writes.length, 1);
    const stored = writes[0].args[0].password;
    assert.notEqual(stored, originalPassword);
    assert.equal(bcrypt.getRounds(stored), 15);
    assert.equal(await bcrypt.compare(originalPassword, stored), true);
    assert.equal(user.password, stored);
  });
}

test('saving unrelated changes does not hash an existing password again', async () => {
  const user = User.hydrate({ _id: new Types.ObjectId(), ...userData({ password: originalHash }) });
  const hash = mock.method(bcrypt, 'hash', async () => { throw new Error('Unexpected hashing'); });
  user.name = 'Updated User';

  await user.save();

  assert.equal(hash.mock.callCount(), 0);
  assert.equal(user.password, originalHash);
  assert.equal(writes[0].args[1].$set.password, undefined);
});

for (const method of ['updateOne', 'findOneAndUpdate']) {
  test(`${method} hashes passwords before they reach the collection`, async () => {
    await User[method]({ _id: new Types.ObjectId() }, { $set: { password: 'updated-password' } });

    assert.equal(writes.length, 1);
    const stored = writes[0].args[1].$set.password;
    assert.equal(bcrypt.getRounds(stored), 15);
    assert.equal(await bcrypt.compare('updated-password', stored), true);
  });

  for (const operator of ['direct', '$setOnInsert']) {
    test(`${method} hashes ${operator} passwords, including upserts`, async () => {
      const hash = mock.method(bcrypt, 'hash', async () => originalHash);
      const update = operator === 'direct' ? { password: originalPassword } :
        { [operator]: { password: originalPassword } };

      await User[method]({ email: 'test@example.com' }, update, { upsert: true });

      assert.equal(hash.mock.callCount(), 1);
      assert.deepEqual(hash.mock.calls[0].arguments, [originalPassword, 15]);
      assert.equal(writes[0].args[1][operator === 'direct' ? '$set' : operator].password, originalHash);
    });
  }

  test(`${method} rejects hash failures without writing`, async () => {
    const error = new Error('Hash failed');
    mock.method(bcrypt, 'hash', async () => { throw error; });

    await assert.rejects(User[method]({}, { password: originalPassword }), (caught) => caught === error);
    assert.equal(writes.length, 0);
  });

  for (const password of [null, 123456, 'short']) {
    test(`${method} rejects invalid password ${JSON.stringify(password)} before hashing`, async () => {
      await assert.rejects(User[method]({}, { $set: { password } }), /Password must be a string/);
      assert.equal(writes.length, 0);
    });
  }
}

const forbiddenWrites = [
  ['pipeline update', () => User.updateOne({}, [{ $set: { password: 'plaintext' } }])],
  ['replacement pipeline', () => User.findOneAndUpdate({}, [{ $replaceWith: { password: 'plaintext' } }])],
  ['multi-user password update', () => User.updateMany({}, { $set: { password: 'plaintext' } })],
  ['replaceOne', () => User.replaceOne({}, userData())],
  ['findOneAndReplace', () => User.findOneAndReplace({}, userData())],
  ['password rename target', () => User.updateOne({}, { $rename: { name: 'password' } })],
  ['password rename source', () => User.findOneAndUpdate({}, { $rename: { password: 'name' } })],
  ['nested password write', () => User.updateOne({}, { $set: { 'password.value': 'plaintext' } })],
  ['password removal', () => User.updateOne({}, { $unset: { password: 1 } })],
  ['filter-derived upsert password', () => User.updateOne(
    { password: 'plaintext' }, { $set: { name: 'Test User' } }, { upsert: true }
  )],
  ['nested filter-derived upsert password', () => User.findOneAndUpdate(
    { $and: [{ password: 'plaintext' }] }, { $set: { name: 'Test User' } }, { upsert: true }
  )],
  ['insertMany', () => User.insertMany([userData()])],
  ['lean insertMany', () => User.insertMany([userData()], { lean: true })],
  ['bulkWrite', () => User.bulkWrite([
    { updateOne: { filter: {}, update: { $set: { password: 'plaintext' } } } }
  ])],
  ['bulk insertion', () => User.bulkWrite([{ insertOne: { document: userData() } }])]
];

for (const [name, write] of forbiddenWrites) {
  test(`${name} cannot bypass password processing`, async () => {
    await assert.rejects(write(), /not supported|Passwords must be set|upserts require/);
    assert.equal(writes.length, 0);
  });
}

test('non-password updates still work for updateMany', async () => {
  await User.updateMany({}, { $set: { name: 'Updated User' } });

  assert.equal(writes.length, 1);
  assert.equal(writes[0].args[1].$set.name, 'Updated User');
});

test('document updateOne hashes passwords through query middleware', async () => {
  mock.method(bcrypt, 'hash', async () => originalHash);
  const user = User.hydrate({ _id: new Types.ObjectId(), ...userData({ password: originalHash }) });

  await user.updateOne({ password: originalPassword });

  assert.equal(writes[0].args[1].$set.password, originalHash);
});

test('save propagates hashing errors and never writes plaintext', async () => {
  const error = new Error('Hash failed');
  mock.method(bcrypt, 'hash', async () => { throw error; });
  const log = mock.method(console, 'error', () => {});

  await assert.rejects(new User(userData()).save(), (caught) => caught === error);

  assert.equal(log.mock.callCount(), 1);
  assert.equal(writes.length, 0);
});

for (const [current, next, message] of [
  ['wrong-password', 'new-password', /current password.*incorrect/],
  [originalPassword, originalPassword, /cannot be the same/]
]) {
  test(`changePassword rejects ${message}`, async () => {
    mock.method(console, 'error', () => {});
    const user = User.hydrate({ _id: new Types.ObjectId(), ...userData({ password: originalHash }) });

    await assert.rejects(user.changePassword(current, next), message);

    assert.equal(writes.length, 0);
    assert.equal(user.password, originalHash);
  });
}

test('changePassword propagates save failures', async () => {
  mock.method(console, 'error', () => {});
  const error = new Error('Save failed');
  const user = User.hydrate({ _id: new Types.ObjectId(), ...userData({ password: originalHash }) });
  mock.method(user, 'save', async () => { throw error; });

  await assert.rejects(user.changePassword(originalPassword, 'new-password'), (caught) => caught === error);
  assert.equal(writes.length, 0);
});

test('changePassword persists a processed new password', async () => {
  const newHash = await bcrypt.hash('new-password', 4);
  mock.method(bcrypt, 'hash', async () => newHash);
  const user = User.hydrate({ _id: new Types.ObjectId(), ...userData({ password: originalHash }) });

  await user.changePassword(originalPassword, 'new-password');

  assert.equal(writes.length, 1);
  assert.equal(writes[0].args[1].$set.password, newHash);
  assert.equal(await user.comparePassword('new-password'), true);
  assert.equal(await user.comparePassword(originalPassword), false);
});
