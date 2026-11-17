# Security Specification & Threat Model (ThatQuiz Chile Cloud Sync)

## 1. Data Invariants

1. **Teacher Ownership & PII Isolation**: A `/teachers/{teacherUid}` document is readable and writable exclusively by the verified Google user whose UID matches `teacherUid`. A `/teacherRosterStudents/{studentDocId}` record contains sensitive RUN and initial PIN data and can only be listed or modified by its `ownerUid` teacher or read/PIN-updated by its claimed `linkedStudentUid`.
2. **Non-PII Directory Verification**: `/studentDirectory/{accessCode}` and `/courseJoinCodes/{joinCode}` never contain RUNs or plaintext PINs. `studentDirectory` stores only the 64-char hex SHA-256 `pinHash` and non-sensitive classroom routing metadata; `allow list` is forbidden to non-owners so no user can scrape all access codes across the school.
3. **Enrollment Gate for Evaluations**: Students can only read `/courseFeeds/{courseFeedId}` and `/assignments/{assignmentDocId}` after verifying their identity against `/studentDirectory/{accessCode}` and registering an enrollment document in `/courseMembers/{ownerUid}__{courseId}__{studentUid}`.
4. **Attempt Integrity & Teacher Grading Authority**:
   - A student may create an `/attempts/{attemptDocId}` document only for themselves (`studentUid == request.auth.uid`), referencing a real `/assignments/{assignmentDocId}` and an active `/courseMembers` enrollment, with `score <= totalQuestions`, `chileanGrade` between `1.0` and `7.0`, and `percentage` between `0` and `100`.
   - Students cannot modify or delete grades after submission; only the `ownerUid` teacher may update `chileanGrade`, `percentage`, and `performanceLevel` (when editing a grade in the Evaluation Detail Modal) or delete an attempt (when allowing a retake in "Ver notas").
5. **Temporal & Schema Strictness**: Every write must validate `serverCreatedAt == request.time` on creation, preserve `serverCreatedAt == existing().serverCreatedAt` on update, set `serverUpdatedAt == request.time`, reject unknown keys via `hasOnly()`, enforce string length caps and regex ID guards (`^[a-zA-Z0-9_\\-]+$`).

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Be Denied)

1. **Ghost Field / Shadow Update**: Updating `/attempts/{id}` with `chileanGrade: 7.0` plus an undeclared `isVerified: true` field -> rejected by `hasOnly()` / `affectedKeys().hasOnly()`.
2. **Email Spoofing (`email_verified == false`)**: Unverified auth token claiming `riveralandy@gmail.com` attempting any read/write -> rejected by `isVerifiedUser()`.
3. **Cross-Teacher Roster List Scraping**: Authenticated user querying `/teacherRosterStudents` without `where('ownerUid', '==', uid)` or `where('linkedStudentUid', '==', uid)` -> rejected by `allow list`.
4. **PII Leak via Direct `get`**: Authenticated non-owner, non-linked student requesting `get(/teacherRosterStudents/st-1)` -> rejected by `allow get`.
5. **Unenrolled Exam Snooping**: Signed-in student requesting `get(/assignments/teacherUid_quiz1)` without a matching `/courseMembers/{ownerUid}__{courseId}__{uid}` document -> rejected by `exists(...)`.
6. **Student Grade Self-Tampering**: Student updating `/attempts/{id}` to raise their own `chileanGrade` from `3.5` to `7.0` -> rejected (student has `allow update: if false` on attempts).
7. **Orphaned Attempt Creation**: Student creating `/attempts/{id}` referencing a non-existent `assignmentDocId` -> rejected by `exists(/assignments/...)`.
8. **Score/Grade Bounds Poisoning**: Creating `/attempts/{id}` with `chileanGrade: 9.5` or `percentage: 140` or `score: 25, totalQuestions: 10` -> rejected by range invariants.
9. **ID Poisoning**: Creating a document with a 300-character ID or path characters (`../hack`) -> rejected by `isValidId()`.
10. **Denial-of-Wallet String / Array Exhaustion**: Creating `/assignments/{id}` with `questions.size() == 500` or `title.size() == 10000` -> rejected by size guards.
11. **Timestamp Forgery**: Creating a document with a backdated `serverCreatedAt` (`request.time - duration.value(1, 'd')`) -> rejected by `incoming().serverCreatedAt == request.time`.
12. **Directory Scraping**: Signed-in student running `list` on `/studentDirectory` or `/courseJoinCodes` -> rejected by `allow list` restriction to `ownerUid` / `linkedStudentUid`.
