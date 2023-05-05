var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var URLUtils = require('dw/web/URLUtils');

module.exports.getService = function getService() {
    return LocalServiceRegistry.createService('controller.internal', {
        createRequest: function (service, args) {
            var url = URLUtils.abs(args.controller);
            if (args.params) {
                Object.keys(args.params).forEach(key => url.append(key, args.params[key]));
            }

            service.setURL(url.toString());
            dw.system.Logger.warn(url.toString());
            service.setRequestMethod(args.requestMethod || 'GET');
            service.addHeader('Cookie', 'dwsid=' + args.dwsid);
            return args.body;
        },
        parseResponse: function (service, result) {
            var returns = result.text;
            try {
                returns = JSON.parse(result.text);
            } catch (e) {
                // nothing
            }

            return returns;
        }
    });
};
