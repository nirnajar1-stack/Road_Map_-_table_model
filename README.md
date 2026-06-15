# Road Map — מפת דרכים מודולרית

מערכת לבניית רודמאפ מודולרי לפרויקטים, עם תזמון שלבים ותצוגת מפת דרכים ויזואלית.

## תכונות

- **פרויקטים מרובים** — ניהול כמה מפות דרכים במקביל
- **שלבים מודולריים** — כל שלב נפתח בתאריך ושעה שתגדיר
- **נקודות ציון** — הוספת milestones לכל שלב
- **מפת דרכים ויזואלית** — תצוגה אופקית של כל הנקודות
- **ציר זמן אנכי** — תצוגה לפי סדר כרונולוגי
- **סטטוס אוטומטי** — שלבים נפתחים אוטומטית כשמגיע התאריך

## התקנה מקומית

```bash
npm install
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

## פריסה ל-Vercel דרך GitHub

### 1. העלה ל-GitHub

```bash
git init
git add .
git commit -m "Initial commit: modular roadmap system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/road-map.git
git push -u origin main
```

### 2. חבר ל-Vercel

1. היכנס ל-[vercel.com](https://vercel.com) והתחבר עם חשבון GitHub
2. לחץ **Add New Project**
3. בחר את הריפו `road-map`
4. Vercel יזהה אוטומטית שזה פרויקט Next.js
5. לחץ **Deploy**

כל push ל-`main` יפרוס אוטומטית גרסה חדשה.

## מבנה הפרויקט

```
app/
  page.tsx              # דף הבית — רשימת פרויקטים
  project/[id]/page.tsx # דף פרויקט — מפת דרכים ושלבים
components/
  RoadmapTimeline.tsx   # תצוגת מפת דרכים
  StageCard.tsx         # כרטיס שלב
  StageForm.tsx         # טפסי הוספה
lib/
  types.ts              # טיפוסים
  storage.ts            # שמירה ב-localStorage
hooks/
  useProjects.ts        # ניהול state
```

## הערות

- הנתונים נשמרים ב-**localStorage** בדפדפן (מתאים לשימוש אישי)
- לשמירה משותפת בין מכשירים, ניתן להוסיף בהמשך Vercel Postgres או Supabase
