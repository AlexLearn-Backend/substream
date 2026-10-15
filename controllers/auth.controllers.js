export const signUp = async (req, res) => {
  try {
    res.send({ message: "Signup" })
  
  }
  catch (e) {
    console.error(` ${e.message}`);
    res.status(500).json({ message: "Server Error!"  })
  }
}


export const signIn = async (req, res) => {
  try {
    res.send({ message: "SignIn" });

  }
  catch (e) {
    console.error(`SignIn Error: ${e.message}`);
    res.status(500).json({ error: "Internal Server Error!" });
  }
}


export const signOut = async (req, res) => {
  try {
    res.send({ message: "SignOut" });

  }
  catch (e) {
    console.error(`SignOut Error: ${e.message}`);
    res.status(500).json({ error: "Internal Server Error!" });
  }
}