import "dotenv/config";

export const config = Object.freeze({
  port: Number.parseInt(process.env.PORT || "3001", 10) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  apiName: process.env.API_NAME || "UBO Academic Hub API"
});
