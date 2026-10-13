// Used by the Docker image: nginx serves the app and proxies /api,
// /notificationHub and /Uploads to the backend on the same origin.
export const environment = {
  production: true,
  BACKEND_URL: '/api',
};
