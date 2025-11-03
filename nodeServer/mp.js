import pkg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ujwal",
  password: "123",
  port: 5432,
});

const migratePasswords = async () => {
  try {
    const res = await pool.query("SELECT id, password FROM Users");
    for (const user of res.rows) {
      const plainPassword = user.password;

      // if already hashed, skip
      if (plainPassword.startsWith("$2b$")) {
        console.log(`Skipping ${user.id} (already hashed)`);
        continue;
      }

      // hash old plain-text password
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      // update db
      await pool.query("UPDATE Users SET password = $1 WHERE id = $2", [
        hashedPassword,
        user.id,
      ]);
      console.log(`Updated password for user: ${user.id}`);
    }

    console.log("✅ Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
};

migratePasswords();
