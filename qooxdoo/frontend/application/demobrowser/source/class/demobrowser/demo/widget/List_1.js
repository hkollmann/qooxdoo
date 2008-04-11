/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/* ************************************************************************

#asset(qx/icon/Oxygen/16/places/folder.png)
#asset(qx/icon/Oxygen/48/places/folder.png)

************************************************************************ */

qx.Class.define("demobrowser.demo.widget.List_1",
{
  extend : qx.application.Standalone,

  members :
  {
    main: function()
    {
      this.base(arguments);

      var l1 = new qx.ui.form.List("multi");

      l1.set({ height: 300, width: 150 });

      var item;
      for( var i=1; i<=25; i++ )
      {
        item = new qx.ui.form.ListItem("Item No " + i, "icon/" + ((i % 4) ? "16" : "48") + "/places/folder.png");

        !(i % 9) && (item.setEnabled(false));
        l1.add(item);
      };

      this.getRoot().add(l1, 20, 20);




      var l2 = new qx.ui.form.List("single");

      l2.set({ height: 200, width: 150 });

      var l2l = [ "red", "violett", "rose", "blue", "green", "cyan", "magenta", "yellow", "brown", "orange", "black", "white", "grey", "gray", "brown" ];

      for (var i=0; i<l2l.length; i++) {
        l2.add(new qx.ui.form.ListItem(l2l[i]));
      };

      this.getRoot().add(l2, 400, 20);





      var l3 = new qx.ui.form.List("additive");

      l3.set({ height: 200, width: 150 });

      var l3l = [ "red", "violett", "rose", "blue", "green", "cyan", "magenta", "yellow", "brown", "orange", "black", "white", "grey", "gray", "brown" ];

      for (var i=0; i<l3l.length; i++) {
        l3.add(new qx.ui.form.ListItem(l2l[i]));
      };

      this.getRoot().add(l3, 600, 20);




      var rd1 = new qx.ui.form.RadioButton("Show Label");
      var rd2 = new qx.ui.form.RadioButton("Show Icon");
      var rd3 = new qx.ui.form.RadioButton("Show Both");

      rd1.setValue("label");
      rd2.setValue("icon");
      rd3.setValue("both");

      rd3.setChecked(true);

      this.getRoot().add(rd1, 180, 20);
      this.getRoot().add(rd2, 180, 40);
      this.getRoot().add(rd3, 180, 60);

      var rbm = new qx.ui.core.RadioManager([rd1, rd2, rd3]);

      rbm.addListener("changeSelected", function(e)
      {
        for( var i=0; i<l1.getChildren().length; i++ ) {
          l1.getChildren()[i].setShow(e.getValue().getValue());
        }
      });
    }
  }
});
