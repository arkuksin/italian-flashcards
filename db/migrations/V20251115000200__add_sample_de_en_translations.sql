-- Sample German and English translations for testing multi-language support
-- This migration adds translations for the first 20 words as examples
-- Full translation of all 300+ words should be done separately

-- Update words with German and English translations
-- Common greetings and basics

UPDATE words SET
  german = 'Hallo',
  english = 'Hello'
WHERE russian = 'привет' AND italian = 'ciao';

UPDATE words SET
  german = 'Auf Wiedersehen',
  english = 'Goodbye'
WHERE russian = 'пока' AND italian = 'arrivederci';

UPDATE words SET
  german = 'bitte',
  english = 'please'
WHERE russian = 'пожалуйста' AND italian = 'per favore';

UPDATE words SET
  german = 'danke',
  english = 'thank you'
WHERE russian = 'спасибо' AND italian = 'grazie';

UPDATE words SET
  german = 'ja',
  english = 'yes'
WHERE russian = 'да' AND italian = 'sì';

UPDATE words SET
  german = 'nein',
  english = 'no'
WHERE russian = 'нет' AND italian = 'no';

UPDATE words SET
  german = 'Entschuldigung',
  english = 'excuse me'
WHERE russian = 'извините' AND italian = 'scusi';

UPDATE words SET
  german = 'gut',
  english = 'good'
WHERE russian = 'хорошо' AND italian = 'bene';

UPDATE words SET
  german = 'schlecht',
  english = 'bad'
WHERE russian = 'плохо' AND italian = 'male';

UPDATE words SET
  german = 'Morgen',
  english = 'morning'
WHERE russian = 'утро' AND italian = 'mattina';

UPDATE words SET
  german = 'Tag',
  english = 'day'
WHERE russian = 'день' AND italian = 'giorno';

UPDATE words SET
  german = 'Abend',
  english = 'evening'
WHERE russian = 'вечер' AND italian = 'sera';

UPDATE words SET
  german = 'Nacht',
  english = 'night'
WHERE russian = 'ночь' AND italian = 'notte';

UPDATE words SET
  german = 'Wasser',
  english = 'water'
WHERE russian = 'вода' AND italian = 'acqua';

UPDATE words SET
  german = 'Brot',
  english = 'bread'
WHERE russian = 'хлеб' AND italian = 'pane';

UPDATE words SET
  german = 'Haus',
  english = 'house'
WHERE russian = 'дом' AND italian = 'casa';

UPDATE words SET
  german = 'Tür',
  english = 'door'
WHERE russian = 'дверь' AND italian = 'porta';

UPDATE words SET
  german = 'Fenster',
  english = 'window'
WHERE russian = 'окно' AND italian = 'finestra';

UPDATE words SET
  german = 'Tisch',
  english = 'table'
WHERE russian = 'стол' AND italian = 'tavolo';

UPDATE words SET
  german = 'Stuhl',
  english = 'chair'
WHERE russian = 'стул' AND italian = 'sedia';

-- Add a few more common words
UPDATE words SET
  german = 'Katze',
  english = 'cat'
WHERE russian = 'кот' AND italian = 'gatto';

UPDATE words SET
  german = 'Hund',
  english = 'dog'
WHERE russian = 'собака' AND italian = 'cane';

UPDATE words SET
  german = 'Buch',
  english = 'book'
WHERE russian = 'книга' AND italian = 'libro';

UPDATE words SET
  german = 'Stadt',
  english = 'city'
WHERE russian = 'город' AND italian = 'città';

UPDATE words SET
  german = 'Zeit',
  english = 'time'
WHERE russian = 'время' AND italian = 'tempo';

-- Add comment about remaining translations
COMMENT ON COLUMN words.german IS 'German translation - Sample data added for first ~25 words. Full translation needed for production.';
COMMENT ON COLUMN words.english IS 'English translation - Sample data added for first ~25 words. Full translation needed for production.';
