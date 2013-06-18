const Applet = imports.ui.applet;
const Settings = imports.ui.settings;
const Gtk = imports.gi.Gtk;
const Util = imports.misc.util;
const Lang = imports.lang;


const UUID = "commandLauncher@scollins";


function MyApplet(orientation, panel_height, instanceId) {
    this._init(orientation, panel_height, instanceId);
}

MyApplet.prototype =  {
    __proto__: Applet.IconApplet.prototype,
    
    _init: function(orientation, panel_height, instanceId) {
        try {
            this.orientation = orientation;
            this._instanceId = instanceId;
            Applet.TextIconApplet.prototype._init.call(this, this.orientation, panel_height);
            
            this._bind_settings();
            
            this._set_icon();
            this._set_tooltip();
            
            let settingsMenuItem = new Applet.MenuItem(_("Settings"), Gtk.STOCK_EDIT, Lang.bind(this, this._open_settings));
            this._applet_context_menu.addMenuItem(settingsMenuItem);
            
        } catch(e) {
            global.logError(e);
        }
    },
    
    on_applet_clicked: function(event) {
        try {
            if ( this.command == "" ) this._open_settings();
            else Util.spawnCommandLine(this.command);
        } catch(e) {
            global.logError(e);
        }
    },
    
    _bind_settings: function () {
        this.settings = new Settings.AppletSettings(this, UUID, this._instanceId);
        this.settings.bindProperty(Settings.BindingDirection.IN, "icon", "icon", this._set_icon);
        this.settings.bindProperty(Settings.BindingDirection.IN, "command", "command", function(){});
        this.settings.bindProperty(Settings.BindingDirection.IN, "description", "description", this._set_tooltip);
    },
    
    _open_settings: function() {
        Util.spawnCommandLine("cinnamon-settings applets " + UUID);
    },
    
    _set_icon: function() {
        if ( this.icon.split("/").length > 1 ) this.set_applet_icon_path(this.icon);
        else this.set_applet_icon_name(this.icon);
    },
    
    _set_tooltip: function() {
        this.set_applet_tooltip(this.description);
    }
}


function main(metadata, orientation, panel_height, instanceId) {
    let myApplet = new MyApplet(orientation, panel_height, instanceId);
    return myApplet;
}