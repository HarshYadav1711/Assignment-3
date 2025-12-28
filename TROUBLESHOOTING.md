# Troubleshooting Guide

## Frontend Not Running on Port 3000

### Common Issues and Solutions

#### 1. Port 3000 Already in Use

**Check if port is in use:**
```powershell
Get-NetTCPConnection -LocalPort 3000
```

**Solution:**
- Kill the process using port 3000, OR
- Change the port in `apps/frontend/vite.config.js`:
  ```js
  server: {
    port: 3001,  // Change to available port
  }
  ```
- Update `apps/frontend/.env.local` if needed

#### 2. Dependencies Not Installed

**Check:**
```bash
cd apps/frontend
ls node_modules  # Should show many folders
```

**Solution:**
```bash
cd apps/frontend
npm install
```

#### 3. Frontend Not Started

**Start the frontend:**
```bash
cd apps/frontend
npm run dev
```

**Expected output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

#### 4. Vite Using Different Port

If port 3000 is taken, Vite will automatically use the next available port (3001, 3002, etc.).

**Check the terminal output** - it will show the actual port:
```
➜  Local:   http://localhost:3001/  ← Note the port number
```

#### 5. API Not Running

The frontend needs the API to be running first.

**Start the API:**
```bash
cd apps/api
npm start
```

**Verify API is running:**
- Open `http://localhost:3001/health` in browser
- Should see: `{"success":true,"message":"API is running",...}`

#### 6. Environment Variables Missing

**Check if `.env.local` exists:**
```powershell
Test-Path apps\frontend\.env.local
```

**Create if missing:**
```bash
cd apps/frontend
echo "VITE_API_URL=http://localhost:3001" > .env.local
```

### Step-by-Step Debugging

1. **Check if frontend is running:**
   ```powershell
   Get-Process -Name node
   ```

2. **Check what ports are in use:**
   ```powershell
   Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -ge 3000 -and $_.LocalPort -le 3010}
   ```

3. **Check frontend logs:**
   - Look at the terminal where you ran `npm run dev`
   - Check for error messages

4. **Try accessing different ports:**
   - `http://localhost:3000`
   - `http://localhost:3001`
   - `http://localhost:5173` (Vite default)

5. **Restart the frontend:**
   ```bash
   # Stop (Ctrl+C) and restart
   cd apps/frontend
   npm run dev
   ```

### Quick Fixes

**Option 1: Kill process on port 3000**
```powershell
# Find process
$process = Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess
# Kill it
Stop-Process -Id $process -Force
```

**Option 2: Use different port**
Edit `apps/frontend/vite.config.js`:
```js
server: {
  port: 5173,  // Vite default
}
```

**Option 3: Clear cache and reinstall**
```bash
cd apps/frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Still Not Working?

1. Check browser console for errors (F12)
2. Check terminal for error messages
3. Verify Node.js version: `node --version` (should be 18+)
4. Try running with verbose output:
   ```bash
   cd apps/frontend
   npm run dev -- --debug
   ```

