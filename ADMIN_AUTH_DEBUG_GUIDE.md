# Admin Authentication Debug Guide

## 🔴 Issue: 401 Unauthorized Error

### Root Cause Fixed ✅
**JWT_SECRET Mismatch** - The token was being created with one secret but verified with another (or undefined).

- ✅ Fixed in `lib/auth.ts` to use same fallback as `api/admin/auth.ts`
- ✅ Both now use: `process.env.JWT_SECRET || 'your-secret-key'`

---

## 🔧 How to Troubleshoot

### Step 1: Check Browser Console
Open **DevTools** (F12) → **Console Tab**

Look for these debug logs:

**During Login (Password Step):**
```
📋 Fetching with token: No token
```
(This is normal - no token yet)

**During OTP Verification:**
```
🔐 OTP Verification Response:
- Status: 200
- Success: true
- Has Token: true
- Expires In: 14400 seconds
✅ Token stored successfully
- SessionStorage Keys: ['admin_token', 'admin_expiry', 'admin_access_granted']
```

**If you see:**
```
❌ OTP Verification failed: Invalid or expired OTP
```
→ Check your email for the OTP code, or request a new one

---

### Step 2: Check Admin Page (After Login)

**DevTools** → **Console Tab**

Should see:
```
📋 Fetching Exploring Items:
- Token Present: true
- Token Length: 200+ characters
- Admin Access Flag: true
- Admin Expiry: [timestamp]
📡 API Response:
- Status: 200
- Status Text: OK
✅ Items fetched successfully: [count]
```

**If you see:**
```
❌ Error fetching exploring items:
- Status: 401
- Status Text: Unauthorized
```

→ **This means the token verification failed!**

---

## 🔍 Root Cause Diagnosis

### 401 Error on Admin Page?

#### Check 1: Is Token Stored?
```javascript
// Paste in DevTools Console:
console.log('Token:', sessionStorage.getItem('admin_token'));
console.log('Access Flag:', sessionStorage.getItem('admin_access_granted'));
console.log('Expiry:', sessionStorage.getItem('admin_expiry'));
```

✅ Should show token value and timestamps
❌ If empty/null → You didn't complete login

---

#### Check 2: Is JWT_SECRET Set?

**Option A: Check Environment Variables**
```bash
# In terminal, check if JWT_SECRET is set:
echo $JWT_SECRET
```

If empty, set it:
```bash
# Linux/Mac:
export JWT_SECRET="your-super-secret-key-here"

# Windows PowerShell:
$env:JWT_SECRET="your-super-secret-key-here"
```

**Option B: Edit `.env` file** (if it exists)
```
JWT_SECRET=your-super-secret-key-here
```

---

#### Check 3: Verify Token Creation & Verification

Check **Network Tab** in DevTools:

1. Go to **DevTools** → **Network Tab**
2. Perform login (password + OTP)
3. Find request: `/api/admin/auth?action=verify-otp`
4. Click it → **Response Tab** → Look for:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 14400
}
```

✅ If you see this → Token created successfully
❌ If error response → Check admin auth setup

---

## 🚀 Quick Fix Checklist

- [ ] **Stop dev server** (`Ctrl+C`)
- [ ] **Set JWT_SECRET** environment variable
- [ ] **Start dev server** (`npm run dev`)
- [ ] **Clear browser cache** (Ctrl+Shift+Delete)
- [ ] **Try login again**
- [ ] **Check console for debug logs**

---

## 📋 Complete Login Flow Verification

```
1. Visit /admin/login page
   ✓ See "THE SYSTEM CORE" heading
   
2. Enter password & click "Continue"
   ✓ Console: No errors
   ✓ Next step: OTP input appears
   ✓ UI shows: "OTP sent to [masked email]"
   
3. Enter OTP & click "Verify & Login"
   ✓ Console: Debug logs showing success
   ✓ Redirects to /admin/dashboard
   
4. Check admin page
   ✓ See exploring items list
   ✓ Can create/edit/delete items
   ✓ No 401 errors
```

---

## 🔐 Verification Process (Behind the Scenes)

```
Frontend (AdminLoginPage.tsx)
    ↓ Password + OTP sent (hashed)
Backend (/api/admin/auth.ts)
    ↓ Creates JWT with JWT_SECRET
    ↓ Returns token to client
Frontend (sessionStorage)
    ↓ Stores token
    ↓ Redirects to /admin/dashboard
Frontend (AdminExploring.tsx)
    ↓ Reads token from sessionStorage
    ↓ Sends in Authorization header
Backend (/lib/auth.ts - verifyAuth)
    ↓ Extracts Bearer token
    ↓ Verifies using same JWT_SECRET ← MUST MATCH!
    ↓ Returns 200 if valid, 401 if not
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid password"
- [ ] Check ADMIN_PASSWORD_HASH is set correctly
- [ ] Reset password: `node generate-password-hash.cjs`

### Issue 2: "Failed to send OTP"
- [ ] Check SMTP settings in .env
- [ ] Verify admin email in database: Settings.email
- [ ] Check email configuration: SMTP_USER, SMTP_PASS

### Issue 3: "Invalid or expired OTP"
- [ ] Check OTP from email
- [ ] OTP expires after 5 minutes
- [ ] Click "Resend OTP" if expired

### Issue 4: 401 on admin pages (MAIN ISSUE)
- [ ] ✅ **FIXED**: JWT_SECRET mismatch in lib/auth.ts
- [ ] Set JWT_SECRET environment variable
- [ ] Clear sessionStorage: `sessionStorage.clear()`
- [ ] Re-login from fresh session

### Issue 5: Token not persisting
- [ ] Check browser privacy settings
- [ ] SessionStorage might be disabled
- [ ] Try private/incognito window

---

## 📊 Debug Logs Reference

### Expected Console Output

**Login Success Flow:**
```
✅ Token verified successfully
✅ Token stored successfully
✅ Items fetched successfully: 5
```

**Failure Flow:**
```
❌ Token verification failed: [error message]
❌ No Authorization header or admin_token cookie found
❌ Error fetching exploring items: 401
```

---

## 🆘 Still Having Issues?

1. **Clear Everything:**
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run dev
   ```

2. **Check Backend Logs:**
   - Look at terminal running `npm run dev`
   - Find logs starting with: 🔐 🎫 ✅ ❌

3. **Manually Test Token:**
   ```bash
   # Generate a test token (in DevTools console):
   const secret = 'your-secret-key-here';
   // Then verify if it matches JWT_SECRET
   ```

4. **Reset Admin Access:**
   ```javascript
   // In DevTools Console:
   sessionStorage.clear();
   window.location.href = '/admin/login';
   ```

---

## 📚 Related Files

- `lib/auth.ts` - Token verification (FIXED ✅)
- `api/admin/auth.ts` - Token creation
- `src/pages/AdminLoginPage.tsx` - Login UI
- `src/pages/admin/AdminExploring.tsx` - Admin list page

---

**Last Updated:** May 27, 2026
**Status:** 401 Unauthorized issue IDENTIFIED & FIXED ✅
