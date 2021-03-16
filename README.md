# OpenProject CKEditor5 build repository

This repository acts as a separated source for the custom CKEditor5 builds referenced in OpenProject.


[https://github.com/opf/openproject](https://github.com/opf/openproject)

[https://github.com/ckeditor/ckeditor5](https://github.com/ckeditor/ckeditor5)



1. Install the dependencies

```
# In this repository's root (commonmark-ckeditor-build)
npm install
```

2. Reference the link in OpenProject

```
export OPENPROJECT_CORE=/path/to/openproject/root
```



## Building



Building into the core is easy, just run

`npm run build`



This will override the `app/assets/javascripts/vendor/ckeditor/*` contents with the newest webpack build. You need to run this before opening a pull request.

Please also ensure you always create a pull request on this repository that gets merged whenever the core counterpart gets merged to ensure the master of this branch is always the latest built version in OpenProject


### Updating CKEditor

Whenever a new CKEditor release is made, there are a plethora of packages to be updated. The easiest is to use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) to update all dependencies in the package.json and then rebuild + run openproject tests.


## Development

- Run `npm run watch-and-link`

Now the webpack development mode is symlinking the latest builds into the openproject core. You can now seamlessly develop in this repository and browse/test in OpenProject core


## Adding Plugins 

Before you add a plugin make sure to check to see if it is already present! Search `package-lock.json` for the plugin. If it is already listed do NOT install it. Instead add the import to `op-plugin.js` and the toolbar entry to `op-ckeditor.js`.

```
npm install --save-dev @ckeditor/ckeditor5-font
```
