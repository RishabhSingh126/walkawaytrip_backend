import bcrypt from "bcrypt";

const generateHashPassword = async (password) => {
    // Check if password is provided
    if (!password) {
        throw new Error("Password is required.");
    }
    // Generate a salt
    const salt = await bcrypt.genSalt(12); // 12 rounds for bcrypt
    // Hash the password with the salt
    const hashedPassword = await bcrypt.hash(password, salt);

    return hashedPassword;
};

export { generateHashPassword };