import bcrypt from "bcrypt";

const verifyPassword = async (password, storedHash) => {
    // Compare the provided password with the stored hash
    const isMatch = await bcrypt.compare(password, storedHash);

    return isMatch;
};

export { verifyPassword };