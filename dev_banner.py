"""Dev preview banner middleware for Flask."""
import json
import os
from datetime import datetime, timezone
from flask import request

DEPLOY_INFO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'deploy_info.json')

BANNER_HTML = '''
<div id="dev-preview-banner" style="
    position:fixed;top:0;left:0;right:0;z-index:99999;
    background:linear-gradient(135deg,#ff6b35,#f7c948);
    color:#1a1a2e;padding:8px 16px;font-family:system-ui,sans-serif;
    font-size:14px;font-weight:600;text-align:center;
    box-shadow:0 2px 8px rgba(0,0,0,0.2);display:flex;
    align-items:center;justify-content:center;gap:12px;">
    <span>🚧 Preview: <code style="background:rgba(255,255,255,0.3);padding:2px 6px;border-radius:4px;">{branch}</code>
    {pr_part} — deployed {time_ago}</span>
    <button onclick="this.parentElement.style.display='none';document.body.style.paddingTop='0px';"
        style="background:rgba(0,0,0,0.15);border:none;color:#1a1a2e;cursor:pointer;
        border-radius:50%;width:24px;height:24px;font-size:16px;line-height:1;
        display:flex;align-items:center;justify-content:center;">&times;</button>
</div>
<style>body{{padding-top:44px !important;}}</style>
'''

def _time_ago(deploy_time_str):
    try:
        dt = datetime.fromisoformat(deploy_time_str.replace('Z', '+00:00'))
        delta = datetime.now(timezone.utc) - dt
        minutes = int(delta.total_seconds() / 60)
        if minutes < 1:
            return "just now"
        if minutes < 60:
            return f"{minutes} min ago"
        hours = minutes // 60
        if hours < 24:
            return f"{hours}h ago"
        return f"{hours // 24}d ago"
    except Exception:
        return "unknown"

def get_banner_html():
    try:
        with open(DEPLOY_INFO_PATH) as f:
            info = json.load(f)
    except Exception:
        return ''
    
    branch = info.get('branch', 'unknown')
    pr_number = info.get('pr_number')
    deploy_time = info.get('deploy_time', '')
    pr_part = f'(PR #{pr_number})' if pr_number else ''
    time_ago = _time_ago(deploy_time)
    
    return BANNER_HTML.format(branch=branch, pr_part=pr_part, time_ago=time_ago)

def init_dev_banner(app):
    """Register after_request handler to inject banner into HTML responses."""
    @app.after_request
    def inject_banner(response):
        if (response.content_type and 'text/html' in response.content_type 
            and response.status_code == 200):
            try:
                data = response.get_data(as_text=True)
                banner = get_banner_html()
                if '<body' in data:
                    data = data.replace('<body', banner + '<body', 1)
                elif '<html' in data:
                    data = data + banner
                else:
                    data = banner + data
                response.set_data(data)
                # Update content length
                response.headers['Content-Length'] = len(response.get_data())
            except Exception:
                pass
        return response
