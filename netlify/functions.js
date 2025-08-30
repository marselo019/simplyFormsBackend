// File ini tidak wajib, hanya jika mau pakai Netlify Functions
exports.handler = async (event, context) => {
 return {
  statusCode: 200,
  body: JSON.stringify({ message: "Netlify Function Works!" })
 };
};