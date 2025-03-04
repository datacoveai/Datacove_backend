import { BitlyClient } from "bitly";

const bitly = new BitlyClient("YOUR_BITLY_ACCESS_TOKEN");

async function shortenUrl(longUrl) {
  try {
    const response = await bitly.shorten(longUrl);
    return response.link;
  } catch (error) {
    console.error("Error shortening URL:", error);
    return longUrl;
  }
}
export default shortenUrl;
