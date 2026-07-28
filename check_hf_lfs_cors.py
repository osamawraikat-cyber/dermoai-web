import requests

url = "https://huggingface.co/timm/mobilenetv4_conv_small.e2400_r224_in1k/resolve/main/model.safetensors"

print(f"=== Testing HF LFS Redirect & CORS ===")
print(f"Initial Request URL: {url}")

r = requests.get(url, allow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})

print(f"\n--- Redirect History ({len(r.history)} hops) ---")
for i, hop in enumerate(r.history):
    print(f"Hop {i+1}: {hop.status_code} -> {hop.headers.get('Location')}")
    print(f"  Hop CORS Header: {hop.headers.get('Access-Control-Allow-Origin')}")

print(f"\n--- Final Target Response ---")
print(f"Final URL : {r.url}")
print(f"Final Code: {r.status_code}")
print(f"Final CORS (Access-Control-Allow-Origin): {r.headers.get('Access-Control-Allow-Origin')}")
