
type WeatherResult = {
  badWeather: boolean;
  raw: any;
};

const cache = new Map<string, { ts: number; data: WeatherResult }>();
const TTL = 1000 * 60 * 10; // 10 minutes

export async function getWeatherForCoords(lat: number, lng: number): Promise<WeatherResult> {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.ts < TTL) return cached.data;

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    // no api key configured — fail gracefully
    return { badWeather: false, raw: null };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return { badWeather: false, raw: null };
    const json = await res.json();
    // classify severe weather: rain with intensity or thunderstorm
    const weather = (json.weather || []).map((w:any)=>w.main.toLowerCase());
    const bad = weather.some((w:string)=>['rain','thunderstorm','drizzle','snow','storm'].includes(w));
    const out = { badWeather: bad, raw: json };
    cache.set(key, { ts: now, data: out });
    return out;
  } catch (e) {
    return { badWeather: false, raw: null };
  }
}

const transportWeather = { getWeatherForCoords };
export default transportWeather;
