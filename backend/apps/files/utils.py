import os
import shutil

def get_storage_stats(path="/data"):
    """
    Get storage statistics for the given path.
    Uses shutil.disk_usage for cross-platform compatibility (works on Windows too).
    """
    try:
        # Fallback to current directory if path doesn't exist (dev safety)
        if not os.path.exists(path):
            path = os.getcwd()
            
        total, used, free = shutil.disk_usage(path)

        return {
            "total_bytes": total,
            "used_bytes": used,
            "free_bytes": free,
            "total_gb": round(total / (1024**3), 2),
            "used_gb": round(used / (1024**3), 2),
            "free_gb": round(free / (1024**3), 2),
            "used_percent": round((used / total) * 100, 2)
        }
    except Exception as e:
        print(f"Error reading storage stats: {e}")
        return {
            "total_bytes": 0,
            "used_bytes": 0,
            "free_bytes": 0,
            "total_gb": 0,
            "used_gb": 0,
            "free_gb": 0,
            "used_percent": 0
        }
