/**
 * Standard Result pattern to prevent widespread Error throwing.
 * Ensures all operations across boundaries are typed and recoverable.
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };
