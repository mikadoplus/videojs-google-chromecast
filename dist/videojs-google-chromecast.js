/**
 * videojs-google-chromecast
 * @version 0.0.8
 * @copyright 2020 mikadoplus <plo@mikadoplus.lu>
 * @license UNLICENSED
 */
/*! @name videojs-google-chromecast @version 0.0.8 @license UNLICENSED */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('video.js/dist/alt/video.core.novtt.min')) :
  typeof define === 'function' && define.amd ? define(['video.js/dist/alt/video.core.novtt.min'], factory) :
  (global = global || self, global.videojsGoogleChromecast = factory(global.videojs));
}(this, (function (videojs) { 'use strict';

  videojs = videojs && Object.prototype.hasOwnProperty.call(videojs, 'default') ? videojs['default'] : videojs;

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  var inheritsLoose = _inheritsLoose;

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  var assertThisInitialized = _assertThisInitialized;

  var Component = videojs.getComponent('Component');
  var ControlBar = videojs.getComponent('ControlBar');
  var Button = videojs.getComponent('Button');
  var DEFAULT_VOLUME = 0.5;
  var FULL_VOLUME_HEIGHT = 100;
  var PLAYER_STATE = {
    IDLE: 'IDLE',
    BUFFERING: 'BUFFERING',
    LOADED: 'LOADED',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED'
  };

  var ChromecastButton = /*#__PURE__*/function (_Button) {
    inheritsLoose(ChromecastButton, _Button);

    function ChromecastButton(player, options) {
      var _this2;

      _this2 = _Button.call(this, player, options) || this;
      _this2.player = player;
      _this2.options = options;
      _this2.incrementMediaTimeHandler = _this2.incrementMediaTime.bind(assertThisInitialized(_this2));
      return _this2;
    }

    var _proto = ChromecastButton.prototype;

    _proto.initCastPlayer = function initCastPlayer(player, options) {
      var _this = this;

      this.player = player;
      this.options = options;
      this.sources = {};
      this.casting = false;
      this.apiSession = null;
      this.mDNS = false;
      this.client = {};
      this.receivers = [];
      this.choosenDevice = null;
      this.initPlayerHandler(this);
      this.playerState = PLAYER_STATE.IDLE;
      this.playerStateBeforeSwitch = null;
      this.remotePlayer = null;
      this.remotePlayerController = null;
      this.currentMediaTime = 0;
      this.mediaDuration = -1;
      this.mediaInfo = {};
      this.mediaInfoMDNS = {};
      this.tryingReconnect = 0;
      this.searchAttempts = 5;
      this.timePerAttempt = 1000;
      this.selectedDevice = null;
      this.hide();

      if (options.appId !== undefined && options.appId !== '') {
        this.appId = options.appId;
      } else if (chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID) {
        this.appId = chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID;
      }

      if (options.autoJoinPolicy !== undefined && options.autoJoinPolicy !== '') {
        this.autoJoinPolicy = options.autoJoinPolicy;
      } else if (chrome.cast.AutoJoinPolicy.PAGE_SCOPED) {
        this.autoJoinPolicy = chrome.cast.AutoJoinPolicy.PAGE_SCOPED;
      }

      cast.framework.CastContext.getInstance().setOptions({
        receiverApplicationId: this.appId,
        autoJoinPolicy: this.autoJoinPolicy
      });

      if (options.searchAttempts !== undefined && options.searchAttempts !== '') {
        this.searchAttempts = options.searchAttempts;
      }

      if (options.timePerAttempt !== undefined && options.timePerAttempt !== '') {
        this.timePerAttempt = options.timePerAttempt;
      }

      if (this.options.mdns !== undefined && this.options.mdns) {
        this.mDNS = true;

        var ChromecastAPI = require('chromecast-api');

        this.client = new ChromecastAPI();
        this.container = document.createElement('div');
        this.container.setAttribute('class', 'ReactModalPortal');
        this.container.setAttribute('id', 'containerModal');
        this.contentModal = '' + '<div id="chromecastModal" class="ReactModal__Overlay ReactModal__Overlay--after-open modal-overlay chromecastModal" tabIndex="-1" role="dialog">' + '<section class="card">' + '<button id="closeCast" class="button button--close closeCast" type="button">' + '<span class="button__content">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="icon icon--X"><g><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></g></svg>' + '</span>' + '</button>' + '<div class="card__header--between">' + '<div class="card__section--flex">' + '<div>' + '<h2 className="card__title">Cast to...</h2>' + '</div>' + '</div>' + '<div></div>' + '</div>' + '<div class="card__main-actions">';
        var loader = '<div class="castLoader"></div>';
        this.client.on('device', function (device) {
          if (device !== undefined) {
            _this.receivers.push(device);

            _this.contentModal += '<fieldset-section id="' + device.name + '" class="selectCast"><div id="' + device.name + '" class="castFriendlyName">' + device.friendlyName + '</div>' + loader + '</fieldset-section>';
          }
        });
        this.prepareMediaForCast(function () {});
        hasFinishedSearch();

        function hasFinishedSearch() {
          if (_this.client.hasFinishLoad === true) {
            if (_this.receivers.length > 0) {
              _this.remotePlayer = new cast.framework.RemotePlayer();
              _this.remotePlayerController = new cast.framework.RemotePlayerController(_this.remotePlayer);
              _this.apiInitialized = true;
              setTimeout(_this.initSearchProcess.bind(_this), 0);
            } else {
              _this.hide();

              setTimeout(_this.initSearchProcess.bind(_this), _this.timePerAttempt);
            }
          } else {
            setTimeout(hasFinishedSearch, 100);
          }
        }
      } else {
        this.remotePlayer = new cast.framework.RemotePlayer();
        this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);
        this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED, function (e) {
          this.switchPlayer(e.value);
        }.bind(this));
        this.apiInitialized = true;
        this.initializeUI(player);
        this.setupLocalPlayer();
      }
    };

    _proto.initSearchProcess = function initSearchProcess() {
      videojs.log('Searching Cast APIs...');

      if (this.tryingReconnect < this.searchAttempts) {
        if (this.receivers.length <= 1) {
          ++this.tryingReconnect;
          this.setTimeout(this.initSearchProcess, this.timePerAttempt);
        } else {
          this.contentModal += '</div>' + '</section>' + '</div>';
          this.container.innerHTML = this.contentModal;
          this.remotePlayer = new cast.framework.RemotePlayer();
          this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);
          this.apiInitialized = true;
          this.setupLocalPlayer();
          this.initializeUI(this.player);
          this.show();
        }
      } else {
        if (this.receivers === undefined || this.receivers.length <= 0) {
          videojs.log('Cast APIs not available. Max reconnect attempt');
        } else {
          this.contentModal += '</div>' + '</section>' + '</div>';
          this.container.innerHTML = this.contentModal;
          this.remotePlayer = new cast.framework.RemotePlayer();
          this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer);
          this.apiInitialized = true;
          this.setupLocalPlayer();
          this.initializeUI(this.player);
          this.show();
        }
      }
    };

    _proto.initPlayerHandler = function initPlayerHandler(_this) {
      if (_this === void 0) {
        _this = {};
      }

      this.playerHandler = {};
      this.playerHandler.target = {};

      this.playerHandler.setTarget = function (target) {
        _this.playerHandler.target = target;
      };

      this.playerHandler.play = function () {
        if (_this.playerState === PLAYER_STATE.IDLE || !_this.playerHandler.target.isMediaLoaded()) {
          _this.playerHandler.load();

          return;
        }

        _this.playerState = PLAYER_STATE.PLAYING;

        _this.playerHandler.target.play();
      };

      this.playerHandler.pause = function () {
        _this.playerState = PLAYER_STATE.PAUSED;

        _this.playerHandler.target.pause();
      };

      this.playerHandler.stop = function () {
        _this.playerState = PLAYER_STATE.IDLE;

        _this.playerHandler.target.stop();
      };

      this.playerHandler.load = function () {
        _this.playerState = PLAYER_STATE.BUFFERING;

        _this.playerHandler.target.load();
      };

      this.playerHandler.isMediaLoaded = function () {
        return _this.playerHandler.target.isMediaLoaded();
      };

      this.playerHandler.prepareToPlay = function () {
        _this.mediaDuration = _this.playerHandler.getMediaDuration();

        _this.playerHandler.updateDurationDisplay();

        _this.playerState = PLAYER_STATE.LOADED;

        _this.playerHandler.play();

        _this.playerHandler.updateDisplay();
      };

      this.playerHandler.getCurrentMediaTime = function () {
        return _this.playerHandler.target.getCurrentMediaTime();
      };

      this.playerHandler.getMediaDuration = function () {
        return _this.playerHandler.target.getMediaDuration();
      };

      this.playerHandler.updateDisplay = function () {
        // Update local variables
        _this.playerHandler.currentMediaTime = _this.playerHandler.target.getCurrentMediaTime();
        _this.playerHandler.mediaDuration = _this.playerHandler.target.getMediaDuration();

        _this.playerHandler.target.updateDisplay();
      };

      this.playerHandler.updateCurrentTimeDisplay = function () {
        _this.playerHandler.target.updateCurrentTimeDisplay();
      };

      this.playerHandler.updateDurationDisplay = function () {
        _this.playerHandler.target.updateDurationDisplay();
      };

      this.playerHandler.setTimeString = function (time) {
        _this.playerHandler.target.setTimeString(time);
      };

      this.playerHandler.setVolume = function (volumeSliderPosition) {
        _this.playerHandler.target.setVolume(volumeSliderPosition);
      };

      this.playerHandler.mute = function () {
        _this.playerHandler.target.mute();
      };

      this.playerHandler.unMute = function () {
        _this.playerHandler.target.unMute();
      };

      this.playerHandler.isMuted = function () {
        return _this.playerHandler.target.isMuted();
      };

      this.playerHandler.seekTo = function (time) {
        _this.playerHandler.target.seekTo(time);
      };
    };

    _proto.initializeUI = function initializeUI(player) {
      if (player.controlBar !== undefined) {
        this.createGoogleButton();

        if (this.mDNS) {
          this.createCustomButton();
        } // Avoids inconsistency in videojs


        player.controlBar.chromecastButton = this;
      }
    };

    _proto.createGoogleButton = function createGoogleButton() {
      var jsControlBar = document.getElementsByClassName('vjs-control-bar');

      if (document.getElementsByClassName('vjs-chromecast-button').length <= 0) {
        var castComponent = document.createElement('google-cast-launcher');
        castComponent.setAttribute('class', 'vjs-chromecast-button vjs-control vjs-button');
        castComponent.setAttribute('type', 'button');

        if (jsControlBar.length > 0) {
          jsControlBar[0].appendChild(castComponent);
        }
      }
    };

    _proto.createCustomButton = function createCustomButton() {
      var _this = this;

      var jsControlBar = document.getElementsByClassName('vjs-control-bar');

      if (document.getElementsByClassName('vjs-chromecast-button-mdns').length <= 0) {
        var castComponent = document.createElement('button');
        castComponent.setAttribute('class', 'vjs-chromecast-button-mdns vjs-control vjs-button');
        castComponent.setAttribute('type', 'button');
        castComponent.addEventListener('click', function () {
          _this.findSources();

          _this.prepareMediaForCast(function () {
            document.body.appendChild(_this.container);
            document.getElementById('closeCast').addEventListener('click', _this.closeModal);
            document.getElementById('chromecastModal').addEventListener('click', _this.closeModalFromBack);
            var castSelection = document.getElementsByClassName('selectCast');

            for (var i = 0; i < castSelection.length; i++) {
              (function (index) {
                castSelection[index].addEventListener('click', _this.selectCast.bind(_this));
              })(i);
            }
          });
        });

        if (jsControlBar.length > 0) {
          jsControlBar[0].appendChild(castComponent);
          var getCastBtn = document.getElementsByClassName('vjs-chromecast-button-mdns');
          getCastBtn[0].innerHTML = '<svg x="0px" y="0px" width="100%" height="100%" viewBox="0 0 24 24"><g><path id="cast_caf_icon_arch0" class="cast_caf_status_d" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"></path><path id="cast_caf_icon_arch1" class="cast_caf_status_d" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"></path><path id="cast_caf_icon_arch2" class="cast_caf_status_d" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"></path><path id="cast_caf_icon_box" class="cast_caf_status_d" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"></path><path id="cast_caf_icon_boxfill" class="cast_caf_state_h" d="M5,7 L5,8.63 C8,8.6 13.37,14 13.37,17 L19,17 L19,7 Z"></path></g></svg>';
        }
      }
    };

    _proto.closeModal = function closeModal(e) {
      var el = document.getElementById('containerModal');
      var cloned = el.cloneNode(true);
      el.parentNode.replaceChild(cloned, el);
      document.body.removeChild(cloned);
    };

    _proto.closeModalFromBack = function closeModalFromBack(e) {
      if (e.target === document.getElementById('chromecastModal')) {
        document.body.removeChild(document.getElementById('containerModal'));
      }
    };

    _proto.selectCast = function selectCast(e) {
      var _this3 = this;

      var castId = e.target.id;

      var c = document.getElementById(castId).childNodes;

      if (c.length > 0) {
        c[1].style.opacity = 1;
      }

      for (var i = 0; i < this.receivers.length; i++) {
        if (this.receivers[i].name === castId) {
          this.selectedDevice = this.receivers[i];
        }
      }

      if (this.selectedDevice != null) {
        this.setupLocalPlayer();
        this.playerHandler.pause();
        this.selectedDevice.play(this.mediaInfoMDNS, function (err) {
          if (err) {
            videojs.log(err);
          } else {
            if (c.length > 0) {
              c[1].style.opacity = 0;
              document.getElementsByClassName("vjs-chromecast-button-mdns")[0].classList.add("connected");
            }

            _this3.playerHandler.load();

            _this3.player_.loadTech_('ChromecastTech', {
              type: 'cast',
              cast_: _this3,
              apiSession: _this3.apiSession
            });

            _this3.closeModal(e);

            _this3.casting = true;
          }
        });
      }
    };

    _proto.hide = function hide() {
      _Button.prototype.hide.call(this);

      var castButton = document.getElementsByClassName('vjs-chromecast-button');

      if (castButton.length > 0) {
        castButton[0].style.display = 'none';
      }

      if (this.mDNS) {
        castButton = document.getElementsByClassName('vjs-chromecast-button-mdns');

        if (castButton.length > 0) {
          castButton[0].style.display = 'none';
        }
      }
    };

    _proto.show = function show() {
      _Button.prototype.show.call(this);

      var castButton = null;

      if (this.mDNS) {
        castButton = document.getElementsByClassName('vjs-chromecast-button-mdns');
      } else {
        castButton = document.getElementsByClassName('vjs-chromecast-button');
      }

      if (castButton.length > 0) {
        castButton[0].style.display = 'block';
      }
    };

    _proto.buildCSSClass = function buildCSSClass() {
      if (this.mDNS) {
        return "vjs-chromecast-button-mdns " + _Button.prototype.buildCSSClass.call(this, this);
      }

      return "vjs-chromecast-button " + _Button.prototype.buildCSSClass.call(this, this);
    };

    _proto.receiverListener = function receiverListener(availability) {
      if (this.disposed) {
        return;
      }

      if (availability === 'available') {
        return this.show();
      }

      return this.hide();
    };

    _proto.findSources = function findSources() {
      var source = null;

      if (this.player_ === null) {
        if (this.player.cache_ !== undefined) {
          if (this.player.cache_.source !== undefined) {
            source = this.player.cache_.source;
          }
        }
      } else {
        source = this.player_.currentSource();
      }

      this.sources = source;
      return this.sources;
    };

    _proto.switchPlayer = function switchPlayer(value) {
      this.playerStateBeforeSwitch = this.playerState;

      if (value) {
        this.prepareMediaForCast(function () {
          if (cast && cast.framework && this.remotePlayer.isConnected) {
            this.playerHandler.pause();
            this.setupRemotePlayer();
          } else {
            this.setupLocalPlayer();
          }
        }.bind(this));
      } else {
        this.prepareMediaForCast(this.setupLocalPlayer.bind(this));
      }
    }
    /**
     * Add event listeners for player changes which may occur outside sender app.
     */
    ;

    _proto.setupRemotePlayer = function setupRemotePlayer() {
      // Triggers when the media info or the player state changes
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.MEDIA_INFO_CHANGED, function (event) {
        var session = cast.framework.CastContext.getInstance().getCurrentSession();

        if (!session) {
          this.mediaInfo = null;
          this.playerHandler.updateDisplay();
          return;
        }

        var media = session.getMediaSession();

        if (!media) {
          this.mediaInfo = null;
          this.playerHandler.updateDisplay();
          return;
        }

        this.apiSession = session;
        this.mediaInfo = media.media;

        if (media.playerState === PLAYER_STATE.PLAYING && this.playerState !== PLAYER_STATE.PLAYING) {
          this.playerHandler.prepareToPlay();
        }

        this.playerHandler.updateDisplay();
      }.bind(this));
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.CAN_SEEK_CHANGED, function (event) {//
      });
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.IS_PAUSED_CHANGED, function () {
        if (this.remotePlayer.isPaused) {
          this.playerHandler.pause();
        } else if (this.playerState !== PLAYER_STATE.PLAYING) {
          this.playerHandler.play();
        }
      }.bind(this));
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.IS_MUTED_CHANGED, function () {
        if (this.remotePlayer.isMuted) {
          this.playerHandler.mute();
        } else {
          this.playerHandler.unMute();
        }
      }.bind(this));
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.VOLUME_LEVEL_CHANGED, function () {
        var newVolume = this.remotePlayer.volumeLevel;
        this.player_.setVolume(newVolume);
      }.bind(this));
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.IS_PLAYING_BREAK_CHANGED, function (event) {
        this.isPlayingBreak(event.value);
      }.bind(this));
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.WHEN_SKIPPABLE_CHANGED, function (event) {
        this.onWhenSkippableChanged(event.value);
      }.bind(this));
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.CURRENT_BREAK_CLIP_TIME_CHANGED, function (event) {
        this.onCurrentBreakClipTimeChanged(event.value);
      }.bind(this));
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.BREAK_CLIP_ID_CHANGED, function (event) {
        this.onBreakClipIdChanged(event.value);
      }.bind(this));
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.LIVE_SEEKABLE_RANGE_CHANGED, function (event) {
        videojs.log('LIVE_SEEKABLE_RANGE_CHANGED');
        this.liveSeekableRange = event.value;
      }.bind(this)); // This object will implement PlayerHandler callbacks with
      // remotePlayerController, and makes necessary UI updates specific
      // to remote playback.

      var playerTarget = {};

      playerTarget.play = function () {
        if (this.remotePlayer.isPaused) {
          this.remotePlayerController.playOrPause();
          this.player_.play();
        }
      }.bind(this);

      playerTarget.pause = function () {
        if (!this.remotePlayer.isPaused) {
          this.remotePlayerController.playOrPause();
          this.player_.pause();
        }
      }.bind(this);

      playerTarget.stop = function () {
        this.remotePlayerController.stop();
      }.bind(this); // Load request for local -> remote


      playerTarget.load = function () {
        this.findSources();
        this.prepareMediaForCast(function () {
          videojs.log('Loading...' + this.mediaInfo.metadata.title);
          var request = new chrome.cast.media.LoadRequest(this.mediaInfo);
          request.currentTime = this.currentMediaTime;

          if (!this.playerStateBeforeSwitch || this.playerStateBeforeSwitch === PLAYER_STATE.PAUSED) {
            request.autoplay = false;
          } else {
            request.autoplay = true;
          }

          cast.framework.CastContext.getInstance().getCurrentSession().loadMedia(request).then(function () {
            this.casting = true;
            videojs.log('Remote media loaded');
          }.bind(this), function (errorCode) {
            this.playerState = PLAYER_STATE.IDLE;
            videojs.log('Remote media load error: ' + this.getErrorMessage(errorCode));
            this.playerHandler.updateDisplay();
          }.bind(this));
        }.bind(this));
      };

      playerTarget.isMediaLoaded = function () {
        var session = cast.framework.CastContext.getInstance().getCurrentSession();
        if (!session) return false;
        var media = session.getMediaSession();
        if (!media) return false;

        if (media.playerState === PLAYER_STATE.IDLE) {
          return false;
        }

        this.apiSession = session; // No need to verify local mediaIndex content.

        return true;
      }.bind(this);
      /**
       * @return {number?} Current media time for the content. Always returns
       *      media time even if in clock time (conversion done when displaying).
       */


      playerTarget.getCurrentMediaTime = function () {
        return this.remotePlayer.currentTime;
      }.bind(this);
      /**
       * @return {number?} media time duration for the content. Always returns
       *      media time even if in clock time (conversion done when displaying).
       */


      playerTarget.getMediaDuration = function () {
        return this.remotePlayer.duration;
      }.bind(this);

      playerTarget.updateDisplay = function () {
        var castSession = cast.framework.CastContext.getInstance().getCurrentSession();

        if (castSession && castSession.getMediaSession() && castSession.getMediaSession().media) {
          var media = castSession.getMediaSession();
          var mediaInfo = media.media;

          if (mediaInfo.metadata) {
            var mediaTitle = mediaInfo.metadata.title;
            var mediaEpisodeTitle = mediaInfo.metadata.episodeTitle;
            mediaTitle = mediaEpisodeTitle ? mediaTitle + ': ' + mediaEpisodeTitle : mediaTitle;
            mediaTitle = mediaTitle ? mediaTitle + ' ' : '';
            var mediaSubtitle = mediaInfo.metadata.subtitle;
            mediaSubtitle = mediaSubtitle ? mediaSubtitle + ' ' : '';
          }
        } else {
          // playerstate view
          // switch to local player
          this.currentTech.dispose();
          this.casting = false;
          var time = this.player_.currentTime();
          this.removeClass('connected');
          this.player_.src(this.player_.options_.sources);

          if (!this.player_.paused()) {
            this.player_.one('seeked', function () {
              return this.player_.play();
            });
          }

          this.player_.currentTime(time);
          this.player_.options_.inactivityTimeout = this.inactivityTimeout; // this.apiSession = null
        }
      }.bind(this);

      playerTarget.updateCurrentTimeDisplay = function () {
        this.playerHandler.setTimeString(this.playerHandler.getCurrentMediaTime());
      }.bind(this);

      playerTarget.updateDurationDisplay = function () {
        this.playerHandler.setTimeString(this.playerHandler.getMediaDuration());
      }.bind(this);

      playerTarget.setTimeString = function (time) {
        var currentTimeString = this.getMediaTimeString(time);
      }.bind(this);

      playerTarget.setVolume = function (volumePosition) {
        var currentVolume = this.remotePlayer.volumeLevel;

        if (volumePosition > 1) {
          currentVolume = 1;
        } else {
          currentVolume = volumePosition;
        }

        this.remotePlayer.volumeLevel = currentVolume;
        this.remotePlayerController.setVolumeLevel();
      }.bind(this);

      playerTarget.mute = function () {
        if (!this.remotePlayer.isMuted) {
          this.remotePlayerController.muteOrUnmute();
        }
      }.bind(this);

      playerTarget.unMute = function () {
        if (this.remotePlayer.isMuted) {
          this.remotePlayerController.muteOrUnmute();
        }
      }.bind(this);

      playerTarget.isMuted = function () {
        return this.remotePlayer.isMuted;
      }.bind(this);

      playerTarget.seekTo = function (time) {
        this.remotePlayer.currentTime = time;
        this.remotePlayerController.seek();
      }.bind(this);

      this.playerHandler.setTarget(playerTarget); // Setup remote player properties on setup

      if (this.remotePlayer.isMuted) {
        this.playerHandler.mute();
      } // The remote player may have had a volume set from previous playback
      // var currentVolume = this.remotePlayer.volumeLevel
      // this.player_.setVolume(currentVolume)
      // Show media_control


      this.apiSession = cast.framework.CastContext.getInstance().getCurrentSession();
      this.player_.loadTech_('ChromecastTech', {
        type: 'cast',
        cast_: this,
        apiSession: this.apiSession
      }); // If resuming a session, take the remote properties and continue the existing playback. Otherwise, load local content.

      if (this.apiSession === cast.framework.SessionState.SESSION_RESUMED) {
        this.playerHandler.prepareToPlay();
      } else {
        this.playerHandler.load();
      }
    };

    _proto.setupLocalPlayer = function setupLocalPlayer() {
      // This object will implement PlayerHandler callbacks with localPlayer
      var playerTarget = {};

      var _this = this;

      playerTarget.play = function () {
        videojs.log('local player play');
      };

      playerTarget.pause = function () {
        videojs.log('local player pause');
      };

      playerTarget.stop = function () {
        videojs.log('local player stop');
      };

      playerTarget.load = function () {
        videojs.log('local player load');
      };

      playerTarget.isMediaLoaded = function () {
        this.findSources();

        if (this.mediaInfo === null) {
          return false;
        }

        return true;
      }.bind(this);

      playerTarget.getCurrentMediaTime = function () {
        if (this.player_ !== undefined) {
          return this.player_.currentTime();
        } else if (_this.player_ !== undefined) {
          return _this.player_.currentTime();
        }

        return 0;
      };

      playerTarget.getMediaDuration = function () {
        if (this.player_ !== undefined) {
          return this.player_.duration();
        } else if (_this.player_ !== undefined) {
          return _this.player_.duration();
        }

        return 0;
      };

      playerTarget.updateDisplay = function () {// Do we need to change something in front view ?
      };

      playerTarget.updateCurrentTimeDisplay = function () {
        // Increment for local playback
        this.currentMediaTime += 1;
        this.playerHandler.setTimeString(this.currentMediaTime);
      }.bind(this);

      playerTarget.updateDurationDisplay = function () {
        this.playerHandler.setTimeString(this.mediaDuration);
      }.bind(this);

      playerTarget.setTimeString = function (time) {
        var currentTimeString = this.getMediaTimeString(time);
      }.bind(this);

      playerTarget.setVolume = function (volumePosition) {
        if (this.player_ !== undefined) {
          return this.player_.volume(volumePosition);
        } else if (_this.player_ !== undefined) {
          return _this.player_.volume(volumePosition);
        }
      };

      playerTarget.mute = function () {
        if (this.player_ !== undefined) {
          return this.player_.mute(true);
        } else if (_this.player_ !== undefined) {
          return _this.player_.mute(true);
        }
      };

      playerTarget.unMute = function () {
        if (this.player_ !== undefined) {
          return this.player_.mute(false);
        } else if (_this.player_ !== undefined) {
          return _this.player_.mute(false);
        }
      };

      playerTarget.isMuted = function () {
        if (this.player_ !== undefined) {
          return this.player_.mute();
        } else if (_this.player_ !== undefined) {
          return _this.player_.mute();
        }
      };

      playerTarget.seekTo = function (time) {
        if (this.player_ !== undefined) {
          return this.player_.currentTime(time);
        } else if (_this.player_ !== undefined) {
          return _this.player_.currentTime(time);
        }
      };

      this.playerHandler.setTarget(playerTarget);
      this.playerHandler.setVolume(DEFAULT_VOLUME * FULL_VOLUME_HEIGHT);

      if (this.currentMediaTime > 0) {
        this.playerHandler.load();
        this.playerHandler.play();
      }
    };

    _proto.prepareMediaForCast = function prepareMediaForCast(callback) {
      this.mediaInfo = new chrome.cast.media.MediaInfo(this.sources.src, this.sources.type);
      this.mediaInfo.streamType = chrome.cast.media.StreamType.BUFFERED;
      this.mediaInfo.metadata = new chrome.cast.media.TvShowMediaMetadata();
      this.mediaInfo.metadata.title = '';
      this.mediaInfo.metadata.subtitle = '';

      if (this.options.metadata === undefined) {
        this.options.metadata = {};
      }

      if (this.options.metadata.title !== undefined && this.options.metadata.title !== '') {
        this.mediaInfo.metadata.title = this.options.metadata.title;
      } else {
        var filepages1 = document.getElementsByClassName('file-page__video');

        if (filepages1.length > 0) {
          for (var t = 0; t < filepages1.length; t++) {
            var getTitles = filepages1[t].getElementsByClassName('card__title');

            if (getTitles.length > 0) {
              this.mediaInfo.metadata.title = getTitles[0].innerText;
            }
          }
        }
      }

      if (this.options.metadata.subtitle !== undefined && this.options.metadata.subtitle !== '') {
        this.mediaInfo.metadata.subtitle = this.options.metadata.subtitle;
      } else {
        var filepages2 = document.getElementsByClassName('file-page__video');

        if (filepages2.length > 0) {
          for (var c = 0; c < filepages2.length; c++) {
            var getSubTitles = filepages2[c].getElementsByClassName('channel-name');

            if (getSubTitles.length > 0) {
              this.mediaInfo.metadata.subtitle = getSubTitles[0].innerText;
            }
          }
        }
      }

      var poster = this.player_.poster();

      if (poster) {
        var image = new chrome.cast.Image(poster);
        this.mediaInfo.metadata.images = [{
          url: image
        }];
      }

      this.mediaInfoMDNS.url = this.sources.src;
      this.mediaInfoMDNS.cover = {};
      this.mediaInfoMDNS.cover.title = this.mediaInfo.metadata.title;
      this.mediaInfoMDNS.cover.url = poster;
      callback();
    };

    _proto.onMediaLoadedLocally = function onMediaLoadedLocally() {
      this.player_.currentTime(this.currentMediaTime);
      this.playerHandler.prepareToPlay();
    };

    _proto.seekMedia = function seekMedia(seekTime) {
      if (this.mediaDuration === null || cast.framework.CastContext.getInstance().getCurrentSession() && !this.remotePlayer.canSeek) {
        videojs.log('Error - Not seekable');
        return;
      }

      if (this.playerState === PLAYER_STATE.PLAYING || this.playerState === PLAYER_STATE.PAUSED) {
        this.currentMediaTime = seekTime;
      }

      this.playerHandler.seekTo(seekTime);
    };

    _proto.getErrorMessage = function getErrorMessage(error) {
      switch (error.code) {
        case chrome.cast.ErrorCode.API_NOT_INITIALIZED:
          return 'The API is not initialized.' + (error.description ? ' :' + error.description : '');

        case chrome.cast.ErrorCode.CANCEL:
          return 'The operation was canceled by the user' + (error.description ? ' :' + error.description : '');

        case chrome.cast.ErrorCode.CHANNEL_ERROR:
          return 'A channel to the receiver is not available.' + (error.description ? ' :' + error.description : '');

        case chrome.cast.ErrorCode.EXTENSION_MISSING:
          return 'The Cast extension is not available.' + (error.description ? ' :' + error.description : '');

        case chrome.cast.ErrorCode.INVALID_PARAMETER:
          return 'The parameters to the operation were not valid.' + (error.description ? ' :' + error.description : '');

        case chrome.cast.ErrorCode.RECEIVER_UNAVAILABLE:
          return 'No receiver was compatible with the session request.' + (error.description ? ' :' + error.description : '');

        case chrome.cast.ErrorCode.SESSION_ERROR:
          return 'A session could not be created, or a session was invalid.' + (error.description ? ' :' + error.description : '');

        case chrome.cast.ErrorCode.TIMEOUT:
          return 'The operation timed out.' + (error.description ? ' :' + error.description : '');

        default:
          return error;
      }
    };

    _proto.endPlayback = function endPlayback() {
      this.currentMediaTime = 0;
      this.playerState = PLAYER_STATE.IDLE;
      this.this.updateDisplay();
    };

    _proto.getMediaTimeString = function getMediaTimeString(timestamp) {
      if (timestamp === undefined || timestamp === null) {
        return null;
      }

      var isNegative = false;

      if (timestamp < 0) {
        isNegative = true;
        timestamp *= -1;
      }

      var hours = Math.floor(timestamp / 3600);
      var minutes = Math.floor((timestamp - hours * 3600) / 60);
      var seconds = Math.floor(timestamp - hours * 3600 - minutes * 60);
      if (hours < 10) hours = '0' + hours;
      if (minutes < 10) minutes = '0' + minutes;
      if (seconds < 10) seconds = '0' + seconds;
      return (isNegative ? '-' : '') + hours + ':' + minutes + ':' + seconds;
    };

    _proto.incrementMediaTime = function incrementMediaTime() {
      // First sync with the current player's time
      this.currentMediaTime = this.playerHandler.getCurrentMediaTime();
      this.mediaDuration = this.playerHandler.getMediaDuration();
      this.playerHandler.updateDurationDisplay();

      if (this.mediaDuration === null || this.currentMediaTime < this.mediaDuration) {
        this.playerHandler.updateCurrentTimeDisplay();
      } else if (this.mediaDuration > 0) {
        this.endPlayback();
      }
    };

    return ChromecastButton;
  }(Button);

  ChromecastButton.prototype.controlText_ = 'Chromecast';
  ControlBar.prototype.options_.children.splice(ControlBar.prototype.options_.children.length - 1, 0, 'chromeCastButton');

  if (typeof videojs.getComponent('ChromecastButton') === 'undefined') {
    videojs.registerComponent('ChromecastButton', ChromecastButton);
  }

  var Component$1 = videojs.getComponent('Component');

  var Chromecast = /*#__PURE__*/function (_Component) {
    inheritsLoose(Chromecast, _Component);

    function Chromecast(player, options) {
      var _this;

      _this = _Component.call(this, player, options) || this;
      var buttonChromecast = new ChromecastButton(player, options);

      window.__onGCastApiAvailable = function (isAvailable) {
        if (isAvailable) {
          buttonChromecast.initCastPlayer(player, options);
        }
      };

      if (options.mdns !== undefined && options.mdns) {
        window.__onGCastApiAvailable(true);
      }

      return _this;
    }

    return Chromecast;
  }(Component$1);

  Chromecast.prototype.options_ = {};
  videojs.options.children.push('chromecast');
  videojs.addLanguage('en', {
    'CASTING TO': 'CASTING TO'
  });

  if (typeof videojs.getComponent('Chromecast') === 'undefined') {
    videojs.registerComponent('Chromecast', Chromecast);
  }

  var version = "0.0.8";

  /**
   * Google Chromecast for VideoJS
   *
   * @function chromecast
   * @param    {Object} [options={}]
   *           An object of options left to the plugin author to define.
   */

  var chromecast = function chromecast(options) {
    var player = this;

    if (options === false || options && options.enabled === false) {
      return;
    }

    var allowedOptions = ['appId', 'altSource', 'metadata', 'searchAttempts', 'timePerAttempt', 'onStop', 'onError'];
    allowedOptions.forEach(function (opt) {
      if (player.options_.chromecast === undefined) {
        player.options_.chromecast = [];
      }

      if (player.options_.chromecast[opt] === undefined) {
        options[opt] = '';
      } else {
        options[opt] = player.options_.chromecast[opt];
      }
    });

    if (options.videojs != undefined) {
      var videojs = options.videojs;

      var ChromecastTech = require('../src/js/tech/chromecast-tech')(videojs);

      var googleChromecast = new Chromecast(player, options);
    }
  };

  var registerPlugin = videojs.registerPlugin || videojs.plugin;

  if (typeof videojs.getPlugin('chromecast') === 'undefined') {
    registerPlugin('chromecast', chromecast);
  }

  chromecast.VERSION = version;

  return chromecast;

})));
