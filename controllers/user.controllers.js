export const getUsers = async (req, res) => {
  try {
    res.send({ message: "Get Users" });

  }
  catch (e) {
    console.error(`GetUsers Error: ${e.message}`);
    res.status(500).json({ error: "Internal Server Error!" });
  }
}


export const getUser = async (req, res) => {
  try {
    res.send({ message: "Get User" });

  }
  catch (e) {
    console.error(`GetUser Error: ${e.message}`);
    res.status(500).json({ error: "Internal Server Error!" });
  }
}


export const createUser = async (req, res) => {
  try {
    res.send({ message: "Create User" });

  }
  catch (e) {
    console.error(`CreateUser Error: ${e.message}`);
    res.status(500).json({ error: "Internal Server Error!" });
  }
}


export const updateUser = async (req, res) => {
  try {
    res.send({ message: "Update User" });

  }
  catch (e) {
    console.error(`UpdateUser Error: ${e.message}`);
    res.status(500).json({ error: "Internal Server Error!" });
  }
}


export const deleteUser = async (req, res) => {
  try {
    res.send({ message: "Delete User" });

  }
  catch (e) {
    console.error(`DeleteUser Error: ${e.message}`);
    res.status(500).json({ error: "Internal Server Error!" });
  }
}