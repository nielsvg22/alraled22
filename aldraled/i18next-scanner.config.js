module.exports = {
  input: ['src/**/*.{js,jsx}'],
  output: './',
  options: {
    debug: false,
    func: {
      list: ['t', 'i18n.t'],
      extensions: ['.js', '.jsx'],
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      extensions: ['.js', '.jsx'],
    },
    lngs: ['nl', 'en', 'de'],
    defaultLng: 'nl',
    ns: ['translation'],
    defaultNs: 'translation',
    resource: {
      loadPath: 'src/locales/{{lng}}.json',
      savePath: 'src/locales/{{lng}}.json',
      jsonIndent: 2,
    },
    keySeparator: '.',
    nsSeparator: false,
    interpolation: {
      prefix: '{{',
      suffix: '}}',
    },
  },
};
