
<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# Homebridge Tami4 Edge Shield plugin

This plugin allows you to boil water on your tami4edge device from homekit.

To get token login at <https://www.tami4.co.il/area/lobby> open console and run

```javascript
console.log(document.cookie.split('; ').find(row => row.startsWith('userToken=')).split('=')[1]);
```
