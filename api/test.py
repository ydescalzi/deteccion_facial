from fastapi import FastAPI

app = FastAPI()

@app.get("/api/test")
def test():
    return {"success": True, "message": "FastAPI funciona"}
