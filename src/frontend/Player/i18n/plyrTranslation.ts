import { defineMessages } from 'react-intl';

export const i18nMessages = defineMessages({
  2160: {
    defaultMessage: '4K',
    description: 'Label associatied to the 2160px quality badge',
    id: 'plyr.controls.quality.badge.2160',
  },
  1440: {
    defaultMessage: 'HD',
    description: 'Label associatied to the 1440px quality badge',
    id: 'plyr.controls.quality.badge.1440',
  },
  1080: {
    defaultMessage: 'HD',
    description: 'Label associatied to the 1080px quality badge',
    id: 'plyr.controls.quality.badge.1080',
  },
  720: {
    defaultMessage: 'HD',
    description: 'Label associatied to the 720px quality badge',
    id: 'plyr.controls.quality.badge.720',
  },
  576: {
    defaultMessage: 'SD',
    description: 'Label associatied to the 576px quality badge',
    id: 'plyr.controls.quality.badge.576',
  },
  480: {
    defaultMessage: 'SD',
    description: 'Label associatied to the 480px quality badge',
    id: 'plyr.controls.quality.badge.480',
  },
  advertisement: {
    defaultMessage: 'Ad',
    description:
      'When Ad plugin is used, a countdown is display and this label is used to indicated the remaining time before viewing the video. Eg: Ad - 0:08',
    id: 'plyr.pluging.ad',
  },
  all: {
    defaultMessage: 'All',
    description: 'When loop is activated, loop over all the video',
    id: 'plyr.controls.loop.all',
  },
  buffered: {
    defaultMessage: 'Buffered',
    description: 'Used to indicate the % of buffered video',
    id: 'plyr.controls.progress.buffered',
  },
  captions: {
    defaultMessage: 'Captions',
    description: 'Label used in the setting menu to access captions choices',
    id: 'plyr.ui.settings.captions',
  },
  currentTime: {
    defaultMessage: 'Current time',
    description: 'Indicates the current time in the video.',
    id: 'plyr.controls.currentTime',
  },
  disableCaptions: {
    defaultMessage: 'Disable captions',
    description: 'Button to disable captions',
    id: 'plyr.controls.disableCaptions',
  },
  disabled: {
    defaultMessage: 'Disabled',
    description:
      'label used in the captions menu list to select the disabled option and then disable captions if selected',
    id: 'plyr.controls.captions.menu.disabled',
  },
  download: {
    defaultMessage: 'Download',
    description: 'Download button',
    id: 'plyr.controls.download',
  },
  duration: {
    defaultMessage: 'Duration',
    description: 'Display the total video duration',
    id: 'plyr.ui.display.duration',
  },
  enableCaptions: {
    defaultMessage: 'Enable captions',
    description: 'Button to enable captions',
    id: 'plyr.controls.enableCaptions',
  },
  enabled: {
    defaultMessage: 'enabled',
    description:
      'label used in the captions menu list if captions are enabled and the selected caption has no language nor label',
    id: 'plyr.controls.captions.menu.enabled',
  },
  end: {
    defaultMessage: 'End',
    description:
      'When loop is activated, this the time where the loop should end at',
    id: 'plyr.controls.loop.end',
  },
  enterFullscreen: {
    defaultMessage: 'Enter fullscreen',
    description: 'Button to activate the fullscreen mode',
    id: 'plyr.controls.enterFullscreen',
  },
  exitFullscreen: {
    defaultMessage: 'Exit fullscreen',
    description: 'Button to exit fullscreen mode',
    id: 'plyr.controls.exitFullscreen',
  },
  fastForward: {
    defaultMessage: "Forward '{seektime}'s",
    description: 'Video control forward button',
    id: 'plyr.controls.forward',
  },
  frameTitle: {
    defaultMessage: "Player for '{title}'",
    description:
      'Title set to an iframe when the video is loaded in an iframe as parent element',
    id: 'plyr.ui.frameTitle',
  },
  loop: {
    defaultMessage: 'Loop',
    description:
      "Loop is commented in Plyr's code, it is a feature allowing users to play in loop a video section",
    id: 'plyr.controls.loop',
  },
  menuBack: {
    defaultMessage: 'Go back to previous menu',
    description:
      'When a setting menu is open, this label is added to the button responsible to go back to the previous menu',
    id: 'plyr.ui.menuBack',
  },
  mute: {
    defaultMessage: 'Mute',
    description: 'Mute button',
    id: 'plyr.controls.mute',
  },
  normal: {
    defaultMessage: 'Normal',
    description: 'Value used in the speed setting, corresponding to a 1x speed',
    id: 'plyr.ui.setting.speed.normal',
  },
  pause: {
    defaultMessage: 'Pause',
    description: 'Video control pause button',
    id: 'plyr.controls.pause',
  },
  play: {
    defaultMessage: 'Play',
    description: 'Video control play button',
    id: 'plyr.controls.play',
  },
  played: {
    defaultMessage: 'Played',
    description: 'Used to indicate the % of video played',
    id: 'plyr.controls.progress.played',
  },
  quality: {
    defaultMessage: 'Quality',
    description: 'Label used in the menu to open quality setting',
    id: 'plyr.ui.setting.quality',
  },
  reset: {
    defaultMessage: 'Reset',
    description:
      'When loop is activated, button to reset the loop configuration',
    id: 'plyr.controls.loop.reset',
  },
  restart: {
    defaultMessage: 'Restart',
    description: 'Video control restart button',
    id: 'plyr.controls.restart',
  },
  rewind: {
    defaultMessage: "Rewind '{seektime}'s",
    description: 'Video control rewind button',
    id: 'plyr.controls.rewind',
  },
  seek: {
    defaultMessage: 'Seek',
    description: 'Video control seek slider',
    id: 'plyr.controls.seek',
  },
  seekLabel: {
    defaultMessage: "'{currentTime}' of '{duration}'",
    description: 'Video seek progress bar used as polyfill for webkit',
    id: 'plyr.controls.rangeFill.seek',
  },
  settings: {
    defaultMessage: 'Settings',
    description: 'Label used to indicate settings menu',
    id: 'plyr.ui.settings',
  },
  speed: {
    defaultMessage: 'Speed',
    description: 'Label used in the menu to open speed setting',
    id: 'plyr.ui.setting.speed',
  },
  start: {
    defaultMessage: 'Start',
    description:
      'When loop is activated, this the time where the loop should start at',
    id: 'plyr.controls.loop.start',
  },
  unmute: {
    defaultMessage: 'Unmute',
    description: 'Unmute button',
    id: 'plyr.controls.unmute',
  },
  volume: {
    defaultMessage: 'Volume',
    description:
      'Indicates the zone where the volume is managed in the plyr interface',
    id: 'plyr.controls.volume',
  },
});
