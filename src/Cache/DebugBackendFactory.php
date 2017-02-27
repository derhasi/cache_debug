<?php

namespace Drupal\cache_debug\Cache;

use Drupal\Core\Cache\CacheFactoryInterface;

class DebugBackendFactory implements CacheFactoryInterface {

  /**
   * {@inheritdoc}
   */
  public function get($bin) {
    return new DebugBackend($bin);
  }

}
