<?php

namespace Drupal\cache_debug\Cache;

use Drupal\Core\Cache\MemoryBackend;

class DebugBackend extends MemoryBackend {

  /**
   * {@inheritdoc}
   */
  public function get($cid, $allow_invalid = FALSE) {
    $this->printComment('get', $cid);
    return parent::get($cid, $allow_invalid);
  }

  /**
   * {@inheritdoc}
   */
  public function set($cid, $data, $expire = Cache::PERMANENT, array $tags = array()) {
    $this->printComment('set', $cid, $tags);
    parent::set($cid, $data, $expire, $tags);
  }

  /**
   * {@inheritdoc}
   */
  public function delete($cid) {
    $this->printComment('delete', $cid);
    parent::delete($cid);
  }

  protected function printComment($method, $cid, $tags = NULL) {
    $data = [
      'method' => $method,
      'cid' => $cid,
      'tags' => $tags,
    ];
    print sprintf('<!-- CACHE_DEBUG:%s -->', json_encode($data));
  }

}
