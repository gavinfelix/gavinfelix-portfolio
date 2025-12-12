// Re-export database query functions for admin user operations
import "server-only";

// Re-export database query functions
export { updateAdminUser, getUserById as getAdminUserById } from "./db/queries";

