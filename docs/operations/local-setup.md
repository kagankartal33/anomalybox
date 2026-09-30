# Local Supabase Setup

## Gereksinimler

- Supabase CLI
- Docker Desktop

CLI kontrol:

```powershell
supabase --version
supabase --help
```

## Çalıştırma

```powershell
supabase start
supabase db reset
```

## Doğrulama

Studio:

```text
http://127.0.0.1:54323
```

Tablo kontrolü:

```powershell
supabase status
```

Migration listesi:

```powershell
supabase migration list --local
```

## Notlar

Bu makinede görülen CLI sürümü `2.75.0`; CLI daha yeni sürüm öneriyor. Büyük şema değişikliklerinden önce Supabase CLI güncellemek iyi olur.

Public şema API'ye açık olduğu için RLS kapatılmamalıdır.