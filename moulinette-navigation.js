class MoulinetteNavigationTools {
  
  /**
   * Returns a HTML representing all the scenes
   */
  static getNavigationAsHTML(folder, hideEmpyFolders) {
    if(!folder) {
      return ""
    }

    const hasSubFolder = folder.children && folder.children.length > 0
    const hasScene = folder.contents && folder.contents.length > 0
    
    const folders = []
    if(hasSubFolder) {

      let sortedFolders = folder.children
      console.log(folder.name, folder.sorting, sortedFolders)
      if(folder.sorting == "a") sortedFolders.sort((a,b) => a.folder?.name.toLowerCase().localeCompare(b.folder?.name.toLowerCase()))
      else if(folder.sorting == "m") sortedFolders.sort((a,b) => a.sort-b.sort)

      sortedFolders.forEach((c) => {
        if(c.folder) {
          const html = MoulinetteNavigationTools.getNavigationAsHTML(c.folder, hideEmpyFolders)         
          if(html) folders.push(html)
        }
      })
    }

    // skip empty folder structures
    if(!hasScene && folders.length == 0 && hideEmpyFolders) return null

    let html = `<li>${folder.name}</li>`
    folders.forEach((f) => {
      html += `<ul class="folders">${f}</ul>`
    })
    if(hasScene) {
      html += `<ul class="scenes">`

      let sortedScenes = duplicate(folder.contents)
      if(folder.sorting == "a") sortedScenes.sort((a,b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      else if(folder.sorting == "m") sortedScenes.sort((a,b) => a.sort-b.sort)
      
      // merge scenes based on regex
      var sceneMap = new Map();
      let rx = /(\d+)$/g;
      sortedScenes.forEach((sc) => {
        const match = sc.name.match(rx)
        let base = sc.name
        let name = sc.name
        if(match) {
          base = sc.name.substring(0, sc.name.length - match.length - 1).trim()
          name = match
        } 
        if(!sceneMap.has(base)) {
          sceneMap.set(base, [])
        }
        sceneMap.get(base).push({ id: sc._id, name: name})
      });

      sceneMap.forEach((scenes,key) => {
        if(scenes.length ==  1) {
          html += `<li><a class="mouNavScene" href="" data-id="${scenes[0]._id}">${scenes[0].name}</a></li>`
        } else {
          html += `<li> ${key}`
          scenes.forEach((sc) => html += ` <a class="mouNavScene sub" href="" data-id="${sc.id}">${sc.name}</a>` )
          html += "</li>"
        }
      })
      html += "</ul>"
    }
    
    return html
  }  
}

Hooks.once("init", async function () {
  console.log("Moulinette Navigation Tools | Init") 

  game.settings.register("moulinette-navigation-tools", "hideEmpyFolders", {
    name: game.i18n.localize("mtte.configHideEmptyFolders"),
    hint: game.i18n.localize("mtte.configHideEmptyFoldersHint"),
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });
  
});

Hooks.on("getSceneDirectoryFolderContext", (html, options) => {
  options.push({
    name: game.i18n.localize("mtte.navigation"),
    icon: '<i class="fa-solid fa-ellipsis"></i>',
    callback: async function(li) {
      game.moulinette.navigationtools = game.folders.get($(li).closest("li").data("folderId"))
      if($("#nav-moulinette-toggle").length == 0) {
        $("#ui-top").prepend(`<a id="nav-moulinette-toggle" class="nav-item" role="button" alt="${game.i18n.localize("SCENES.ToggleNav")} (Moulinette)"><i class="fas fa-ellipsis"></i></a><ul id="mouNav" class="folders"/>`);
        $("#navigation").css("margin-left", "38px")
        $("#nav-moulinette-toggle").click((ev) => {
          const nav = $("#mouNav")
          if(nav.is(":hidden")) {
            nav.html(MoulinetteNavigationTools.getNavigationAsHTML(game.moulinette.navigationtools, game.settings.get("moulinette-navigation-tools", "hideEmpyFolders")))
            nav.find(".mouNavScene").click((ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              const link = $(ev.currentTarget)
              const id = link.data("id")
              const scene = game.scenes.get(id);
              if (ev.shiftKey) {
                scene.activate();
              } else {
                scene.view();
              }
            })
          }
          nav.toggle()
        })
      } else {
        $("#mouNav").html(MoulinetteNavigationTools.getNavigationAsHTML(game.moulinette.navigationtools, game.settings.get("moulinette-navigation-tools", "hideEmpyFolders")))
      }
    },
    condition: li => {
      return true;
    },
  });
});