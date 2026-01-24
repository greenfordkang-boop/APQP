# Supabase Storage 정책 (project-files)

파일 업로드 실패가 **401/403** 또는 **"not allowed"**, **"new row violates row-level security"** 인 경우 Storage/RLS 정책 문제로 보면 된다.

---

## 1. 버킷 생성 (Dashboard)

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택  
2. **Storage** → **New bucket**  
3. Name: `project-files`  
4. **Public bucket**: ON (공개 URL 사용 시) 또는 OFF 후 아래 정책으로 읽기 허용  
5. File size limit: `10` MB  
6. Allowed MIME: `*` 또는  
   `application/pdf, image/*, text/csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json, text/plain`

---

## 2. Storage 정책 (SQL Editor에서 실행)

아래는 **개발/데모용** 최소 정책이다. 프로덕션에서는 `auth.role() = 'authenticated'` 등으로 제한할 것.

```sql
-- project-files 버킷에 대해 anon/public INSERT 허용
CREATE POLICY "Allow public uploads to project-files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'project-files');

-- project-files 버킷 읽기 (Public URL 또는 getPublicUrl 사용 시)
CREATE POLICY "Allow public read project-files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-files');

-- (선택) 기존 파일 덮어쓰기/삭제가 필요하면
-- CREATE POLICY "Allow public update project-files"
-- ON storage.objects FOR UPDATE TO public USING (bucket_id = 'project-files') WITH CHECK (bucket_id = 'project-files');
-- CREATE POLICY "Allow public delete project-files"
-- ON storage.objects FOR DELETE TO public USING (bucket_id = 'project-files');
```

`storage.objects`에 이미 RLS가 켜져 있으면, 위 정책만 추가한다.  
정책이 없어서 403이 났다면 위 적용 후 다시 업로드 시도.

---

## 3. Dashboard에서 정책 추가 (SQL 대신)

1. **Storage** → **project-files** → **Policies**  
2. **New Policy** → “For full customization”  
3. Policy name: `Allow anon upload`  
4. Allowed operation: **INSERT**  
5. Target roles: `public` (또는 `anon`)  
6. WITH CHECK expression: `bucket_id = 'project-files'`  
7. 같은 방식으로 **SELECT**용 정책 추가 (읽기)

---

## 4. 더 안전한 방법: Edge Function / API Route

- **Supabase Edge Function**: 클라이언트는 Presigned URL만 받고, 실제 업로드는 서버/Edge에서 수행  
- **Next.js API Route / 기타 백엔드**: `@supabase/supabase-js`에 **service_role** 키로 Storage `upload()` 호출  
- 이 경우 anon에게 Storage INSERT 권한을 주지 않아도 되어, 401/403 가능성이 줄어든다.

---

## 5. 체크리스트

- [ ] Storage에 `project-files` 버킷 존재  
- [ ] `project-files`에 INSERT(업로드) 정책 있음  
- [ ] `project-files`에 SELECT(읽기) 정책 있음 (Public URL 사용 시)  
- [ ] `.env`에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 (placeholder 아님)  
- [ ] `.env` 수정 후 `npm run dev` **재시작**
