-- Migration: Add 50 new vocabulary words
-- Generated manually on 2025-11-09 UTC
-- Inserts themed vocabulary covering professions, transport, food, nature, weather, sports, emotions,
-- arts, communication, events, clothing, and objects to enrich the learning dataset.

INSERT INTO words (id, russian, italian, category)
VALUES
  (301, 'архитектор', 'architetto', 'professions'),
  (302, 'дизайнер', 'designer', 'professions'),
  (303, 'журналист', 'giornalista', 'professions'),
  (304, 'фермер', 'contadino', 'professions'),
  (305, 'программист', 'programmatore', 'professions'),
  (306, 'троллейбус', 'filobus', 'transport'),
  (307, 'вертолет', 'elicottero', 'transport'),
  (308, 'самокат', 'monopattino', 'transport'),
  (309, 'катер', 'motoscafo', 'transport'),
  (310, 'грузовик', 'camion', 'transport'),
  (311, 'ягода', 'bacca', 'food'),
  (312, 'ветчина', 'prosciutto', 'food'),
  (313, 'пшеница', 'grano', 'food'),
  (314, 'орех', 'noce', 'food'),
  (315, 'специя', 'spezia', 'food'),
  (316, 'водопад', 'cascata', 'nature'),
  (317, 'пещера', 'grotta', 'nature'),
  (318, 'берег', 'riva', 'nature'),
  (319, 'утес', 'scogliera', 'nature'),
  (320, 'пастбище', 'pascolo', 'nature'),
  (321, 'град', 'grandine', 'weather'),
  (322, 'морось', 'pioggerella', 'weather'),
  (323, 'иней', 'brina', 'weather'),
  (324, 'засуха', 'siccità', 'weather'),
  (325, 'лыжник', 'sciatore', 'sports'),
  (326, 'турнир', 'torneo', 'sports'),
  (327, 'бегун', 'corridore', 'sports'),
  (328, 'тренер', 'allenatore', 'sports'),
  (329, 'вратарь', 'portiere', 'sports'),
  (330, 'воодушевление', 'entusiasmo', 'emotions'),
  (331, 'сомнение', 'dubbio', 'emotions'),
  (332, 'спокойствие', 'calma', 'emotions'),
  (333, 'нервозность', 'nervosismo', 'emotions'),
  (334, 'сочувствие', 'compassione', 'emotions'),
  (335, 'скульптура', 'scultura', 'arts'),
  (336, 'перспектива', 'prospettiva', 'arts'),
  (337, 'мастерская', 'atelier', 'arts'),
  (338, 'кисть', 'pennello', 'arts'),
  (339, 'партитура', 'spartito', 'arts'),
  (340, 'объявление', 'annuncio', 'communication'),
  (341, 'переговоры', 'negoziati', 'communication'),
  (342, 'звонок', 'chiamata', 'communication'),
  (343, 'переводчик', 'interprete', 'communication'),
  (344, 'церемония', 'cerimonia', 'events'),
  (345, 'ярмарка', 'fiera', 'events'),
  (346, 'жилет', 'gilet', 'clothing'),
  (347, 'пояс', 'cintura', 'clothing'),
  (348, 'варежки', 'manopole', 'clothing'),
  (349, 'галстук', 'cravatta', 'clothing'),
  (350, 'фонарик', 'torcia', 'objects')
ON CONFLICT (id) DO UPDATE
SET
  russian = EXCLUDED.russian,
  italian = EXCLUDED.italian,
  category = EXCLUDED.category;

-- Keep the serial sequence aligned with the highest ID
SELECT setval(
  pg_get_serial_sequence('words', 'id')::regclass,
  COALESCE((SELECT MAX(id) FROM words), 0),
  true
);
