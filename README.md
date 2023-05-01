# Homebridge Panasonic MirAIe AC Platform

[![GitHub version](https://img.shields.io/github/package-json/v/thisisharishr/homebridge-panasonic-miraie-ac-platform?label=GitHub)](https://github.com/thisisharishr/homebridge-panasonic-miraie-ac-platform)
[![Publish package to npm](https://img.shields.io/github/workflow/status/thisisharishr/homebridge-panasonic-miraie-ac-platform/Publish%20package%20to%20npm?label=Publish%20to%20npm)](https://github.com/thisisharishr/homebridge-panasonic-miraie-ac-platform/actions/workflows/npm-publish.yml)
[![npm version](https://img.shields.io/npm/v/homebridge-panasonic-miraie-ac-platform?color=%23cb3837&label=npm)](https://www.npmjs.com/package/homebridge-panasonic-miraie-ac-platform)

`homebridge-panasonic-miraie-ac-platform` is a dynamic platform plugin for [Homebridge](https://homebridge.io) that provides HomeKit support for Panasonic MirAIe air conditioners over MQTT.

## How it works
The plugin communicates with your AC units through the `MirAIe Platform`. This means your units must be registered and set up there before you can use this plugin.

All devices that are set up on your MirAIe account will appear in your Home app. If you remove a device from your MirAIe account, it will also disappear from your Home app after you restart Homebridge.

## Homebridge setup
Configure the plugin through the settings UI or directly in the JSON editor:

```json
{
  "platforms": [
    {
        "platform": "Panasonic MirAIe AC Platform",
        "name": "Homebridge Panasonic MirAIe AC Platform",
        "userId": "mail@example.com",
        "password": "********",
        "logLevel": 4,
        "suppressOutgoingUpdates": false
    }
  ]
}
```

Required:

* `name` (string):
Will be displayed in the Homebridge log.

* `userId` (string):
The username of your MirAIe Platform account.

* `password` (string):
The password of your account.

Optional:

* `logLevel` (boolean):
The minimum loglevel of the logs written to log file. 0 is off and 4 is Error level.

* `suppressOutgoingUpdates` (boolean):
If `true`, changes in the Home app will not be sent to Comfort Cloud. Useful for testing your installation without constantly switching the state of your AC to minimise wear and tear.

## Troubleshooting

If you have any issues with this plugin, choose the debug log leve in the settings (and restart the plugin). This will print additional information to the log. If this doesn't help you resolve the issue, feel free to create a [GitHub issue](https://github.com/thisisharishr/homebridge-panasonic-miraie-ac-platform/issues) and attach the available debugging information.

## Contributing

You can contribute to this project in the following ways:

* Test/use the plugin and [report issues and share feedback](https://github.com/thisisharishr/homebridge-panasonic-miraie-ac-platform/issues).

* Review source code changes [before](https://github.com/thisisharishr/homebridge-panasonic--miraie-ac-platform/pulls) and [after](https://github.com/thisisharishr/homebridge-panasonic-miraie-ac-platform/commits/master) they are published.

* Contribute with your own bug fixes, code clean-ups, or additional features (pull requests are accepted).

## Acknowledgements
* Thanks to [embee8](https://github.com/embee8) for creating and maintaining [homebridge-panasonic-ac-platform](https://github.com/embee8/homebridge-panasonic-ac-platform)
* Thanks to [codyc1515](https://github.com/codyc1515) for creating and maintaining [homebridge-panasonic-air-conditioner](https://github.com/codyc1515/homebridge-panasonic-air-conditioner)
* Thanks to [milothomas](https://github.com/milothomas) for creating and maintaining [ha-miraie-ac](https://github.com/milothomas/ha-miraie-ac), which served as motivation for this MirAIe platform plugin and proved particularly helpful in determining MirAIe API request/response payloads and MirAIe MQTT topics/contracts.
* Thanks to the team behind Homebridge. Your efforts do not go unnoticed.

## Disclaimer
All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them.
