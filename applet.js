const Applet = imports.ui.applet;
const Main = imports.ui.main;
const Settings = imports.ui.settings;
const Tweener = imports.ui.tweener;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const Util = imports.misc.util;
const Lang = imports.lang;
const Mainloop = imports.mainloop;


const UUID = "commandLauncher@scollins";
const ICON_HEIGHT = 22;


function MyApplet(metadata, orientation, panel_height, instanceId) {
    this._init(metadata, orientation, panel_height, instanceId);
}

MyApplet.prototype =  {
    __proto__: Applet.IconApplet.prototype,
    
    _init: function(metadata, orientation, panel_height, instanceId) {
        try {
            
            this.metadata = metadata;
            this.instanceId = instanceId;
            Applet.IconApplet.prototype._init.call(this, this.orientation, panel_height);
            
            this._bindSettings();
            
            this._setIcon();
            this._setTooltip();
            
        } catch(e) {
            global.logError(e);
        }
    },
    
    on_applet_clicked: function(event) {
        this.launch();
    },
    
    openSettings: function() {
        Util.spawnCommandLine("cinnamon-settings applets " + this.metadata["uuid"] + " " + this.instanceId);
    },
    
    launch: function() {
        try {
            let allocation = this._applet_icon_box.get_allocation_box();
            this._applet_icon_box.width = allocation.x2 - allocation.x1;
            this._applet_icon_box.height = allocation.y2 - allocation.y1;
            this._animate(3);
            if ( this.command == "" ) this.openSettings();
            else Util.spawnCommandLine(this.command);
        } catch(e) {
            global.logError(e);
        }
    },
    
    _bindSettings: function () {
        this.settings = new Settings.AppletSettings(this, this.metadata["uuid"], this.instanceId);
        this.settings.bindProperty(Settings.BindingDirection.IN, "icon", "icon", this._setIcon);
        this.settings.bindProperty(Settings.BindingDirection.IN, "command", "command", function(){});
        this.settings.bindProperty(Settings.BindingDirection.IN, "description", "description", this._setTooltip);
        this.settings.bindProperty(Settings.BindingDirection.IN, "keyLaunch", "keyLaunch", this._setKeybinding);
        this._setKeybinding();
    },
    
    _setKeybinding: function() {
        if ( this.keyId ) Main.keybindingManager.removeHotKey(this.keyId);
        if ( this.keyLaunch == "" ) return;
        this.keyId = "placesCenter-open";
        Main.keybindingManager.addHotKey(this.keyId, this.keyLaunch, Lang.bind(this, this.launch));
    },
    
    _setIcon: function() {
        if ( this.icon.split("/").length > 1 ) this.set_applet_icon_path(this.icon);
        else {
            this._applet_icon = St.TextureCache.get_default().load_gicon(null, new Gio.ThemedIcon({ name: this.icon }), ICON_HEIGHT);
            this._applet_icon_box.child = this._applet_icon;
            this.__icon_type = -1;
            this.__icon_name = this.icon;
        }
    },
    
    _setTooltip: function() {
        this.set_applet_tooltip(this.description);
    },
    
    _animate:function(count) {
        if ( count < 1 ) return;
        Tweener.addTween(this._applet_icon, {
            width: ICON_HEIGHT * .8,
            height: ICON_HEIGHT * .8,
            time: 0.2,
            transition: 'easeOutQuad',
            onComplete: function() {
                Tweener.addTween(this._applet_icon, {
                    width: ICON_HEIGHT,
                    height: ICON_HEIGHT,
                    time: 0.2,
                    transition: 'easeOutQuad',
                    onComplete: function() {
                        this._animate(count-1);
                    },
                    onCompleteScope: this
                });
            },
            onCompleteScope: this
        });
    }
}


function main(metadata, orientation, panel_height, instanceId) {
    let myApplet = new MyApplet(metadata, orientation, panel_height, instanceId);
    return myApplet;
}