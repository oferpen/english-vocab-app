-- CreateTable
CREATE TABLE "parent_accounts" (
    "id" TEXT NOT NULL,
    "pinHash" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "name" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveChildId" TEXT,
    "settingsJson" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "parent_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "id" TEXT NOT NULL,
    "parentAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "age" INTEGER,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "words" (
    "id" TEXT NOT NULL,
    "englishWord" TEXT NOT NULL,
    "hebrewTranslation" TEXT NOT NULL,
    "phonetic" TEXT,
    "exampleEn" TEXT,
    "exampleHe" TEXT,
    "category" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "level" INTEGER NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "timesSeenInLearn" INTEGER NOT NULL DEFAULT 0,
    "quizAttempts" INTEGER NOT NULL DEFAULT 0,
    "quizCorrect" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3),
    "masteryScore" INTEGER NOT NULL DEFAULT 0,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "wordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "questionType" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "isExtra" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_states" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "missionKey" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "periodStartDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "level_states" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "level_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letters" (
    "id" TEXT NOT NULL,
    "letter" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hebrewName" TEXT,
    "sound" TEXT,
    "imageUrl" TEXT,
    "audioUrl" TEXT,
    "order" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "letter_progress" (
    "id" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "letterId" TEXT NOT NULL,
    "timesSeen" INTEGER NOT NULL DEFAULT 0,
    "timesCorrect" INTEGER NOT NULL DEFAULT 0,
    "mastered" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "letter_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parent_accounts_email_key" ON "parent_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parent_accounts_googleId_key" ON "parent_accounts"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "words_englishWord_key" ON "words"("englishWord");

-- CreateIndex
CREATE UNIQUE INDEX "progress_childId_wordId_key" ON "progress"("childId", "wordId");

-- CreateIndex
CREATE UNIQUE INDEX "mission_states_childId_periodType_missionKey_periodStartDat_key" ON "mission_states"("childId", "periodType", "missionKey", "periodStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "level_states_childId_key" ON "level_states"("childId");

-- CreateIndex
CREATE UNIQUE INDEX "letters_letter_key" ON "letters"("letter");

-- CreateIndex
CREATE UNIQUE INDEX "letter_progress_childId_letterId_key" ON "letter_progress"("childId", "letterId");

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "child_profiles_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "parent_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_states" ADD CONSTRAINT "mission_states_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "level_states" ADD CONSTRAINT "level_states_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_progress" ADD CONSTRAINT "letter_progress_childId_fkey" FOREIGN KEY ("childId") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "letter_progress" ADD CONSTRAINT "letter_progress_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "letters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
