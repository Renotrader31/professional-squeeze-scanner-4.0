// Stream API - Currently disabled for deployment
export default async function handler(req, res) {
  res.status(200).json({ 
    message: "Stream API temporarily disabled",
    status: "ok" 
  });
}
