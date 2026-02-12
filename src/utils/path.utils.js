import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (go up from utils to src to project root)
export const getProjectRoot = () => {
  return path.join(__dirname, "..", "..");
};

export const getUploadsDir = () => {
  return path.join(getProjectRoot(), "uploads");
};
