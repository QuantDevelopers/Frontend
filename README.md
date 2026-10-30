# TSETMC Option Dashboard

داشبورد تحلیل و پایش قراردادهای اختیار معامله بورس تهران (TSETMC).

---

## اجرای پروژه با داکر (Docker Compose)

### پیش‌نیازها
- نصب [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

### اجرای پروداکشن روی پورت ۵۱۷۳

برای بیلد و اجرای نسخه Nginx پروداکشن:

```bash
docker compose up -d --build
```

- داشبورد روی پورت `5173` در دسترس است:
  [http://localhost:5173](http://localhost:5173)
- برای توقف کانتینر:
  ```bash
  docker compose down
  ```

---

## متغیرهای محیطی (Environment Variables)

می‌توانید فایل `.env` را بر اساس `.env.example` تنظیم نمایید:

| متغیر | مقدار پیش‌فرض | توضیحات |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:8000` | آدرس سرور FastAPI بک‌اند |
| `PORT` | `5173` | پورت هاست برای دسترسی به کانتینر پروداکشن فرانت‌اند |
