# cache_debug

:fire: This module might break your site and is only intended for local debugging. 

A cache debug helper for Drupal 8:

* Renders cache calls as HTML comments
* Displays HTML Comments via JS Snippet

## Installation

* Install the package via composer: `composer require derhasi/cache_debug:dev-master --dev`
* Enable the module: `drush en cache_debug`
* Add `$settings['cache']['bins']['render'] = 'cache.backend.cache_debug';` to your `settings.local.php` for checking local
