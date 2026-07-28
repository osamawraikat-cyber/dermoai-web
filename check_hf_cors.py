import urllib.request
import urllib.parse
import ssl

class RedirectHandler(urllib.request.HTTPRedirectHandler):
    def http_error_302(self, req, fp, code, msg, headers):
        print(f"\n[REDIRECT HOP 302]")
        print(f"From URL : {req.full_url}")
        print(f"To URL   : {headers.get('Location')}")
        print(f"Hop CORS : {headers.get('Access-Control-Allow-Origin')}")
        return super().http_error_302(req, fp, code, msg, headers)

def check_cors(url):
    print(f"=== Testing URL: {url} ===")
    opener = urllib.request.build_opener(RedirectHandler)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        ctx = ssl.create_default_context()
        res = opener.open(req)
        print(f"\n[FINAL RESPONSE 200 OK]")
        print(f"Final URL : {res.geturl()}")
        print(f"Final CORS: {res.headers.get('Access-Control-Allow-Origin')}")
        print(f"Final Content-Type: {res.headers.get('Content-Type')}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_cors("https://huggingface.co/bert-base-uncased/resolve/main/config.json")
