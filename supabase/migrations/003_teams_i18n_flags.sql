-- ============================================================
-- Add multilingual names and flag_url to teams
-- ============================================================

alter table public.teams
  add column if not exists name_en text,
  add column if not exists name_es text,
  add column if not exists name_it text;

-- Populate flag_url and localized names for all 48 teams
-- Flag URLs use flagsapi.com (flat/64) except Scotland and England
update public.teams set
  flag_url = 'https://flagsapi.com/DZ/flat/64.png',
  name_en = 'Algeria',
  name_es = 'Argelia',
  name_it = 'Algeria'
where code = 'ALG';

update public.teams set
  flag_url = 'https://flagsapi.com/AR/flat/64.png',
  name_en = 'Argentina',
  name_es = 'Argentina',
  name_it = 'Argentina'
where code = 'ARG';

update public.teams set
  flag_url = 'https://flagsapi.com/AU/flat/64.png',
  name_en = 'Australia',
  name_es = 'Australia',
  name_it = 'Australia'
where code = 'AUS';

update public.teams set
  flag_url = 'https://flagsapi.com/AT/flat/64.png',
  name_en = 'Austria',
  name_es = 'Austria',
  name_it = 'Austria'
where code = 'AUT';

update public.teams set
  flag_url = 'https://flagsapi.com/BE/flat/64.png',
  name_en = 'Belgium',
  name_es = 'Bélgica',
  name_it = 'Belgio'
where code = 'BEL';

update public.teams set
  flag_url = 'https://flagsapi.com/BA/flat/64.png',
  name_en = 'Bosnia and Herzegovina',
  name_es = 'Bosnia y Herzegovina',
  name_it = 'Bosnia ed Erzegovina'
where code = 'BIH';

update public.teams set
  flag_url = 'https://flagsapi.com/BR/flat/64.png',
  name_en = 'Brazil',
  name_es = 'Brasil',
  name_it = 'Brasile'
where code = 'BRA';

update public.teams set
  flag_url = 'https://flagsapi.com/CV/flat/64.png',
  name_en = 'Cabo Verde',
  name_es = 'Cabo Verde',
  name_it = 'Capo Verde'
where code = 'CPV';

update public.teams set
  flag_url = 'https://flagsapi.com/CA/flat/64.png',
  name_en = 'Canada',
  name_es = 'Canadá',
  name_it = 'Canada'
where code = 'CAN';

update public.teams set
  flag_url = 'https://flagsapi.com/CO/flat/64.png',
  name_en = 'Colombia',
  name_es = 'Colombia',
  name_it = 'Colombia'
where code = 'COL';

update public.teams set
  flag_url = 'https://flagsapi.com/CD/flat/64.png',
  name_en = 'Congo DR',
  name_es = 'Congo RD',
  name_it = 'Congo RD'
where code = 'COD';

update public.teams set
  flag_url = 'https://flagsapi.com/CI/flat/64.png',
  name_en = 'Côte d''Ivoire',
  name_es = 'Costa de Marfil',
  name_it = 'Costa d''Avorio'
where code = 'CIV';

update public.teams set
  flag_url = 'https://flagsapi.com/HR/flat/64.png',
  name_en = 'Croatia',
  name_es = 'Croacia',
  name_it = 'Croazia'
where code = 'CRO';

update public.teams set
  flag_url = 'https://flagsapi.com/CW/flat/64.png',
  name_en = 'Curaçao',
  name_es = 'Curazao',
  name_it = 'Curaçao'
where code = 'CUW';

update public.teams set
  flag_url = 'https://flagsapi.com/CZ/flat/64.png',
  name_en = 'Czechia',
  name_es = 'República Checa',
  name_it = 'Repubblica Ceca'
where code = 'CZE';

update public.teams set
  flag_url = 'https://flagsapi.com/EC/flat/64.png',
  name_en = 'Ecuador',
  name_es = 'Ecuador',
  name_it = 'Ecuador'
where code = 'ECU';

update public.teams set
  flag_url = 'https://flagsapi.com/EG/flat/64.png',
  name_en = 'Egypt',
  name_es = 'Egipto',
  name_it = 'Egitto'
where code = 'EGY';

update public.teams set
  flag_url = 'https://flagsapi.com/GB/flat/64.png',
  name_en = 'England',
  name_es = 'Inglaterra',
  name_it = 'Inghilterra'
where code = 'ENG';

update public.teams set
  flag_url = 'https://flagsapi.com/FR/flat/64.png',
  name_en = 'France',
  name_es = 'Francia',
  name_it = 'Francia'
where code = 'FRA';

update public.teams set
  flag_url = 'https://flagsapi.com/DE/flat/64.png',
  name_en = 'Germany',
  name_es = 'Alemania',
  name_it = 'Germania'
where code = 'GER';

update public.teams set
  flag_url = 'https://flagsapi.com/GH/flat/64.png',
  name_en = 'Ghana',
  name_es = 'Ghana',
  name_it = 'Ghana'
where code = 'GHA';

update public.teams set
  flag_url = 'https://flagsapi.com/HT/flat/64.png',
  name_en = 'Haiti',
  name_es = 'Haití',
  name_it = 'Haiti'
where code = 'HAI';

update public.teams set
  flag_url = 'https://flagsapi.com/IR/flat/64.png',
  name_en = 'IR Iran',
  name_es = 'Irán',
  name_it = 'Iran'
where code = 'IRN';

update public.teams set
  flag_url = 'https://flagsapi.com/IQ/flat/64.png',
  name_en = 'Iraq',
  name_es = 'Irak',
  name_it = 'Iraq'
where code = 'IRQ';

update public.teams set
  flag_url = 'https://flagsapi.com/JP/flat/64.png',
  name_en = 'Japan',
  name_es = 'Japón',
  name_it = 'Giappone'
where code = 'JPN';

update public.teams set
  flag_url = 'https://flagsapi.com/JO/flat/64.png',
  name_en = 'Jordan',
  name_es = 'Jordania',
  name_it = 'Giordania'
where code = 'JOR';

update public.teams set
  flag_url = 'https://flagsapi.com/KR/flat/64.png',
  name_en = 'Korea Republic',
  name_es = 'Corea del Sur',
  name_it = 'Corea del Sud'
where code = 'KOR';

update public.teams set
  flag_url = 'https://flagsapi.com/MX/flat/64.png',
  name_en = 'Mexico',
  name_es = 'México',
  name_it = 'Messico'
where code = 'MEX';

update public.teams set
  flag_url = 'https://flagsapi.com/MA/flat/64.png',
  name_en = 'Morocco',
  name_es = 'Marruecos',
  name_it = 'Marocco'
where code = 'MAR';

update public.teams set
  flag_url = 'https://flagsapi.com/NL/flat/64.png',
  name_en = 'Netherlands',
  name_es = 'Países Bajos',
  name_it = 'Paesi Bassi'
where code = 'NED';

update public.teams set
  flag_url = 'https://flagsapi.com/NZ/flat/64.png',
  name_en = 'New Zealand',
  name_es = 'Nueva Zelanda',
  name_it = 'Nuova Zelanda'
where code = 'NZL';

update public.teams set
  flag_url = 'https://flagsapi.com/NO/flat/64.png',
  name_en = 'Norway',
  name_es = 'Noruega',
  name_it = 'Norvegia'
where code = 'NOR';

update public.teams set
  flag_url = 'https://flagsapi.com/PA/flat/64.png',
  name_en = 'Panama',
  name_es = 'Panamá',
  name_it = 'Panama'
where code = 'PAN';

update public.teams set
  flag_url = 'https://flagsapi.com/PY/flat/64.png',
  name_en = 'Paraguay',
  name_es = 'Paraguay',
  name_it = 'Paraguay'
where code = 'PAR';

update public.teams set
  flag_url = 'https://flagsapi.com/PT/flat/64.png',
  name_en = 'Portugal',
  name_es = 'Portugal',
  name_it = 'Portogallo'
where code = 'POR';

update public.teams set
  flag_url = 'https://flagsapi.com/QA/flat/64.png',
  name_en = 'Qatar',
  name_es = 'Catar',
  name_it = 'Qatar'
where code = 'QAT';

update public.teams set
  flag_url = 'https://flagsapi.com/SA/flat/64.png',
  name_en = 'Saudi Arabia',
  name_es = 'Arabia Saudita',
  name_it = 'Arabia Saudita'
where code = 'KSA';

update public.teams set
  flag_url = 'https://flagcdn.com/h120/gb-sct.jpg',
  name_en = 'Scotland',
  name_es = 'Escocia',
  name_it = 'Scozia'
where code = 'SCO';

update public.teams set
  flag_url = 'https://flagsapi.com/SN/flat/64.png',
  name_en = 'Senegal',
  name_es = 'Senegal',
  name_it = 'Senegal'
where code = 'SEN';

update public.teams set
  flag_url = 'https://flagsapi.com/ZA/flat/64.png',
  name_en = 'South Africa',
  name_es = 'Sudáfrica',
  name_it = 'Sudafrica'
where code = 'RSA';

update public.teams set
  flag_url = 'https://flagsapi.com/ES/flat/64.png',
  name_en = 'Spain',
  name_es = 'España',
  name_it = 'Spagna'
where code = 'ESP';

update public.teams set
  flag_url = 'https://flagsapi.com/SE/flat/64.png',
  name_en = 'Sweden',
  name_es = 'Suecia',
  name_it = 'Svezia'
where code = 'SWE';

update public.teams set
  flag_url = 'https://flagsapi.com/CH/flat/64.png',
  name_en = 'Switzerland',
  name_es = 'Suiza',
  name_it = 'Svizzera'
where code = 'SUI';

update public.teams set
  flag_url = 'https://flagsapi.com/TN/flat/64.png',
  name_en = 'Tunisia',
  name_es = 'Túnez',
  name_it = 'Tunisia'
where code = 'TUN';

update public.teams set
  flag_url = 'https://flagsapi.com/TR/flat/64.png',
  name_en = 'Türkiye',
  name_es = 'Turquía',
  name_it = 'Turchia'
where code = 'TUR';

update public.teams set
  flag_url = 'https://flagsapi.com/UY/flat/64.png',
  name_en = 'Uruguay',
  name_es = 'Uruguay',
  name_it = 'Uruguay'
where code = 'URU';

update public.teams set
  flag_url = 'https://flagsapi.com/US/flat/64.png',
  name_en = 'USA',
  name_es = 'Estados Unidos',
  name_it = 'Stati Uniti'
where code = 'USA';

update public.teams set
  flag_url = 'https://flagsapi.com/UZ/flat/64.png',
  name_en = 'Uzbekistan',
  name_es = 'Uzbekistán',
  name_it = 'Uzbekistan'
where code = 'UZB';
