
.. _features:

*****************
Функционал движка
*****************

Общее
=====

* эффективный рендеринг трёхмерных сцен любой сложности и размеров
* формат хранения данных, учитывающий специфику работы WebGL и оптимизированный с целью минимизации времени загрузки
* удобная среда разработки трёхмерного контента на основе плагина к Blender

Текстуры
========

* текстурирование (texturing) - покрытие поверхности 3D объекта плоским изображением
* мультитекстурирование (multitexturing) - использование для объекта нескольких текстур
* рендеринг в текстуру (render-to-texture, RTT) для реализации вложения одной сцены в другую и постпроцессинговых эффектов
* анизотропная фильтрация для улучшения качества обзора поверхности под косыми углами (anisotropic filtering, AF, использовано стандартное расширение WebGL)
* поддержка текстурной компрессии (формат S3TC/DXT)
* видео-текстуры - загрузка и воспроизведение видео на текстуре
* Canvas-текстуры - возможность отрисовки двухмерной графики через Canvas API в текстуре

Материалы
=========

* прозрачность материалов, сортировка по глубине при необходимости (z-sorting)
* улучшенная детализация рельефных поверхностей текстурами (использован метод parallax offset mapping)
* зависимость степени отражения от угла обзора - эффект Френеля (Fresnel)
* динамическое отражение
* поддержка нодовых материалов
* гало материал для рендеринга источников света и звезд (Halo material)

Освещение
=========

* освещение несколькими источниками света
* типы источников света - прямой (directional), полусферический (hemisphere), точечный (point), конический (spot)
* диффузное (т.е. рассеянное) освещение объектов (diffuse lighting)
* рассеянное освещение от окружающей среды (ambient lighting)
* зеркальное отражение света от поверхности объектов (specular lighting)
* зеркальное отражение окружающей среды (environment mapping)
* дополнительная детализация картами нормалей к поверхности (normal mapping)

Тени
====

* статические падающие тени (light mapping)
* динамические падающие тени (использован метод shadow mapping)
* собственные тени — объекты отбрасывают тени сами на себя (self-shadowing)
* каскадные тени для больших сцен (cascaded shadow mapping, CSM)
* мягкие тени

Система частиц
==============

* система частиц (particle system) для реализации эффектов, таких как огонь, дым, брызги и т.д.
* система частиц для расстановки (инстансинга) однородных объектов: трава, камни, листва деревьев и проч.

Рендеринг наружных сцен
=======================

* туман (fog)
* купол неба/окружающего пространства (skydome)
* эффект линз при направлении камеры на источник света (lens flares)
* рендеринг воды

Постпроцессинговые эффекты
==========================

* размытие при движении (motion blur)
* антиалиасинг - уменьшение зубчатости краев изображения в результате рендеринга в текстуру (использован метод fast approximate anti-aliasing, FXAA)
* стерео-изображение (анаглифное, 3D очки)
* рассеянное затенение от окружающей среды (ambient occlusion, используется метод SSAO)
* глубина резкости для камеры (DOF)
* сумеречные лучи (god rays)
* эффект засветки ярких объектов (bloom)
* подсветка контуров объектов (outlining)


Анимация
========

* скиннинг (skinning) - деформация объекта с помощью системы костей
* анимация перемещения, вращения, масштабирования объектов, камер и источников света
* скелетная анимация (например, для тела персонажа)
* вертексная анимация (например, для симуляции ткани)
* процедурная анимация (например, изгибание растений на ветру)
* анимация текстурных координат (например, для визуализации волн воды)

Оптимизация
===========

* оптимизация отсечением по зоне видимости (frustum culling)
* оптимизация уменьшением количества вызовов WebGL — батчинг, текстурные атласы (batching, texture atlases)
* оптимизация уменьшением уровня детализации объектов на удалении (level of detail, LOD)

Звук
====

* звуковой движок, основанный на Web Audio API
* поддержка различных форматов файлов с учётом различий браузеров
* гибкое управление воспроизведением, возможность приостановки звука
* позиционирование источников в трёхмерном пространстве
* эффект Допплера для движущихся объектов с возможностью отключения и
  компенсацией скачков в пространстве
* управление громкостью, скоростью и задержкой воспроизведения
* эффекты плавного перехода громкости (fade-in, fade-out, duck)
* качественное зацикливание звуков (looping)
* рандомизация звуковых параметров для улучшения восприятия повторяющихся звуков
* поддержка кроссфейдерной звуковой анимации
* динамический компрессор
* эффективное хранение и воспроизведение длинных музыкальных композиций
* инструменты для сведения (микширования) звуковой картины в реальном времени 

Физика
======

* физика жестких тел - определение столкновений, движение, гравитация, определение высоты, опрокидывание
* система соединителей (ограничителей) - жёсткие, гибкие, пружинящие, поворотные, скользящие итд.
* система трассировки лучей
* физика плавания объектов и движения в толще воды
* физика колёсных транспортных средств
* физика плавучих транспортных средств

Событийная модель
=================

* асинхронный фреймворк для написания логики приложений
* управление анимацией и искусственный интеллект животных и персонажей

Визуальное программирование
===========================

* инструмент NLA Script предоставляет возможность создавать интерактивные приложения, конструируя логические цепочки из простых блоков

Прочее
======

* поддержка математических кривых для моделирования удлиненных объектов (дороги, провода, река)
* выбор пользователем объектов на 3D сцене (picking)
* минификация (уменьшение объема) и обфускация (сокрытие) кода, необходимые для коммерческого использования движка
* модульная структура исходного кода
* мощный шейдерный препроцессор с поддержкой модулей и функциональных блоков (нод)
* удобная система для быстрого развертывания новых 3D приложений
* опции для поддержки работы на широком спектре оборудования 
* руководство пользователя и документация для программистов
* взаимодействие с пользователем — управление камерой, персонажем, действиями
