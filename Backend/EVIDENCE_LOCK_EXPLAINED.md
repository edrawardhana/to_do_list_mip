# Evidence Lock Feature - Explained

**Date**: May 6, 2026  
**Feature**: Evidence Lock (Security Feature)  
**Status**: ✅ WORKING AS INTENDED

---

## What You're Seeing

### Error Message
```
Bukti foto sudah terkunci dan tidak dapat diubah. Hubungi Admin jika ada kesalahan.
```

### What This Means
✅ **This is CORRECT behavior!**

Sistem mencegah intern mengubah bukti foto setelah upload pertama kali.

---

## Why This Feature Exists

### Security Reasons

1. **Prevent Evidence Tampering**
   - Intern tidak bisa mengubah bukti setelah submit
   - Menjaga integritas data
   - Audit trail tetap valid

2. **Accountability**
   - Bukti foto original terjaga
   - Admin dapat review dengan confidence
   - Tidak ada perubahan tersembunyi

3. **Compliance**
   - Sesuai dengan audit requirements
   - Memenuhi data integrity standards
   - Legal protection

---

## How It Works

### First Upload ✅ (Allowed)

```
Intern upload foto → evidence_url = NULL
                  ↓
         Sistem menerima
                  ↓
         evidence_url = "http://localhost:8000/storage/..."
                  ↓
         ✅ SUCCESS
```

### Second Upload ❌ (Blocked)

```
Intern coba upload lagi → evidence_url = "http://localhost:8000/storage/..."
                       ↓
              Sistem check: "Sudah ada?"
                       ↓
                    YES!
                       ↓
         ❌ BLOCKED: "Bukti foto sudah terkunci..."
```

### Admin Override ✅ (Allowed)

```
Admin update via admin endpoint → role = 'admin'
                               ↓
                    Trigger check role
                               ↓
                    role = 'admin'? YES!
                               ↓
                    ✅ ALLOWED
```

---

## User Scenarios

### Scenario 1: Intern Upload Pertama Kali

**Action**: Intern upload foto untuk task

**Result**: ✅ SUCCESS
```json
{
  "status": "success",
  "message": "Laporan berhasil dikirim. Menunggu persetujuan Admin.",
  "data": {
    "evidence_url": "http://localhost:8000/storage/task_evidence/task_xxx.jpg",
    "status": "pending"
  }
}
```

---

### Scenario 2: Intern Coba Upload Lagi (Mistake)

**Action**: Intern coba upload foto lagi ke task yang sama

**Result**: ❌ BLOCKED
```json
{
  "status": "error",
  "message": "Bukti foto sudah terkunci dan tidak dapat diubah. Hubungi Admin jika ada kesalahan."
}
```

**What to do**: Hubungi admin untuk perubahan

---

### Scenario 3: Admin Perlu Update Bukti

**Action**: Admin update bukti via admin endpoint

**Result**: ✅ ALLOWED (via admin endpoint)

**How**: Admin punya endpoint terpisah untuk override:
```
POST /api/daily-tasks/{id}/admin-update-evidence
```

---

## Frontend Behavior

### Before Upload
```jsx
<button onClick={handleUpload}>
  📤 Upload Bukti
</button>
```

### After Upload
```jsx
{task.evidence_url && (
  <div className="flex items-center gap-2">
    <a href={task.evidence_url} target="_blank">
      🖼️ Lihat Bukti
    </a>
    <span className="text-xs text-amber-600">
      🔒 Terkunci
    </span>
  </div>
)}
```

**Upload button should be disabled** setelah upload pertama.

---

## Database Trigger

### Trigger Function
```sql
CREATE FUNCTION fn_lock_evidence_url()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.evidence_url IS NOT NULL 
       AND NEW.evidence_url IS DISTINCT FROM OLD.evidence_url THEN
        
        IF current_user_role = 'intern' THEN
            RAISE EXCEPTION 'Bukti foto sudah terkunci...';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Trigger Behavior

| Condition | User Role | Result |
|-----------|-----------|--------|
| First upload | Any | ✅ ALLOW |
| Re-upload | intern | ❌ BLOCK |
| Re-upload | admin | ✅ ALLOW |
| Re-upload | super_admin | ✅ ALLOW |

---

## What Intern Should Do

### If Upload Mistake

**Scenario**: Intern upload foto yang salah

**Solution**:
1. ❌ Jangan coba upload lagi (akan error)
2. ✅ Hubungi admin divisi
3. ✅ Admin akan update bukti via admin endpoint
4. ✅ Sistem akan log perubahan di audit trail

---

## What Admin Should Do

### If Intern Requests Change

**Scenario**: Intern minta ubah bukti foto

**Solution**:
1. Review request dari intern
2. Verify alasan perubahan
3. Use admin endpoint untuk update:
   ```
   POST /api/daily-tasks/{id}/admin-update-evidence
   ```
4. System akan log perubahan
5. Notify intern tentang perubahan

---

## API Endpoints

### Intern Endpoint (First Upload Only)
```
POST /api/daily-tasks/{id}/submit
- evidence_url: file (first time only)
- description: string

Response:
- ✅ First upload: SUCCESS
- ❌ Re-upload: ERROR "Bukti foto sudah terkunci..."
```

### Admin Endpoint (Override)
```
POST /api/daily-tasks/{id}/admin-update-evidence
- evidence_url: file (can update anytime)
- reason: string (why updating)

Response:
- ✅ Always allowed for admin
- Logs change in audit trail
```

---

## Audit Trail

### What Gets Logged

```sql
INSERT INTO audit_logs (
    user_id,
    action,
    old_values,
    new_values,
    target_user_id
) VALUES (
    admin_id,
    'Update Evidence',
    '{"evidence_url": "old_url"}',
    '{"evidence_url": "new_url"}',
    intern_id
);
```

### Who Can See
- ✅ Admin (own division)
- ✅ Super admin (all)
- ❌ Intern (cannot see)

---

## Testing

### Test 1: First Upload ✅
```
1. Login as intern
2. Select task without evidence
3. Upload photo
4. ✅ Should succeed
```

### Test 2: Re-upload Prevention ✅
```
1. Try upload again to same task
2. ❌ Should show error: "Bukti foto sudah terkunci..."
3. ✅ CORRECT BEHAVIOR
```

### Test 3: Admin Override ✅
```
1. Login as admin
2. Find task with evidence
3. Use admin endpoint to update
4. ✅ Should succeed
5. ✅ Audit log should record change
```

---

## FAQ

### Q: Kenapa tidak bisa upload lagi?
**A**: Ini adalah security feature. Bukti foto harus terkunci setelah upload pertama untuk menjaga integritas data.

### Q: Bagaimana jika upload salah?
**A**: Hubungi admin divisi. Admin dapat update bukti via admin endpoint.

### Q: Apakah admin bisa ubah bukti?
**A**: Ya, admin punya endpoint terpisah untuk override. Perubahan akan dicatat di audit trail.

### Q: Apakah ini permanent?
**A**: Ya, bukti foto terkunci permanent. Hanya admin yang bisa ubah.

### Q: Bagaimana jika ada kesalahan sistem?
**A**: Hubungi admin. Admin dapat investigate dan update jika diperlukan.

---

## Configuration

### Backend Code
```php
// DailyTaskController.php - submit() method
if ($task->evidence_url) {
    return response()->json([
        'status' => 'error',
        'message' => 'Bukti foto sudah terkunci dan tidak dapat diubah. Hubungi Admin jika ada kesalahan.'
    ], 403);
}
```

### Database Trigger
```sql
-- Supabase: fn_lock_evidence_url()
-- Prevents UPDATE if evidence_url already exists
-- Only allows admin to override
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Feature** | Evidence Lock (Security) |
| **Purpose** | Prevent tampering, maintain integrity |
| **First Upload** | ✅ Allowed |
| **Re-upload** | ❌ Blocked for intern |
| **Admin Override** | ✅ Allowed |
| **Audit Trail** | ✅ Logged |
| **Error Message** | "Bukti foto sudah terkunci..." |

---

## Conclusion

🔒 **Evidence Lock is WORKING CORRECTLY!**

- ✅ First upload succeeds
- ✅ Re-upload blocked (expected)
- ✅ Admin can override
- ✅ Security maintained
- ✅ Audit trail recorded

**This is the intended behavior.** ✅

---

**Next Steps**:
1. ✅ Confirm this is expected behavior
2. ✅ Test with different scenarios
3. ✅ Update frontend to disable re-upload button
4. ✅ Inform users about the lock feature
