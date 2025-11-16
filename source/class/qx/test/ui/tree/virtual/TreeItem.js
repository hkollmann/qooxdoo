/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     MIT: https://opensource.org/licenses/MIT
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Mustafa Sak (msak)

************************************************************************ */

/**
 * @ignore(qx.test.ui.tree.virtual.Node)
 * @ignore(qx.test.ui.tree.virtual.NodeDefered)
 * @ignore(qx.test.ui.tree.virtual.Leaf)
 */
qx.Class.define("qx.test.ui.tree.virtual.TreeItem", {
  extend: qx.test.ui.tree.virtual.AbstractTreeTest,

  construct() {
    super();

    qx.Class.define("qx.test.ui.tree.virtual.NodeDefered", {
      extend: qx.test.ui.tree.virtual.Leaf,

      properties: {
        children: {
          check: "qx.data.Array",
          event: "changeChildren",
          apply: "_applyEventPropagation",
          nullable: true
        }
      },

      destruct() {
        if (!qx.core.ObjectRegistry.inShutDown) {
          var children = this.getChildren();
          if (children) {
            for (var i = 0; i < children.getLength(); i++) {
              children.getItem(i).dispose();
            }
            children.dispose();
          }
        }
      }
    });
  },

  members: {
    testChildrenSetDeferred() {
      var that = this;
      var root = new qx.test.ui.tree.virtual.Node("Root node");
      var node = new qx.test.ui.tree.virtual.NodeDefered("Node1");
      root.getChildren().push(node);

      this.tree.setLabelPath("name");
      this.tree.setChildProperty("children");
      this.tree.setModel(root);
      this.flush();

      window.setTimeout(
        that.resumeHandler(function () {
          // add new node
          node.setChildren(
            new qx.data.Array([
              new qx.test.ui.tree.virtual.NodeDefered("Node1.1")
            ])
          );

          // check for event listener
          that.assertTrue(
            node.hasListener("changeChildren"),
            "There must be a 'changeChildren' event listener!"
          );

          that.assertTrue(
            node.getChildren().hasListener("changeLength"),
            "There must be a 'changeLength' event listener on children array!"
          );

          // check for open indent
          var widget = that.__getWidgetForm(node);
          that.assertTrue(widget.isOpenable(), "Must be openable!");

          // dispose and check if event listeners are removed
          root.dispose();

          that.assertFalse(
            node.hasListener("changeChildren"),
            "After disposing, there has not be a 'changeChildren' event listener!"
          );

          that.assertFalse(
            node.getChildren().hasListener("changeLength"),
            "After disposing, there must not be a 'changeLength' event listener on children array!"
          );
        }),
        0
      );

      // children property not set yet
      this.assertNull(node.getChildren(), "Must be null");
      this.wait(50);
    },

    __getWidgetForm(modelItem) {
      var widget = null;
      var row = this.tree.getLookupTable().indexOf(modelItem);
      if (row > -1) {
        widget = this.tree._layer.getRenderedCellWidget(row, 0);
      }
      return widget;
    },

    /**
     * Test case for issue #10470: getModel() returns wrong model after collapse/expand
     *
     * The bug occurs when:
     * 1. A tree item is expanded
     * 2. The same tree item is collapsed
     * 3. The tree item is re-expanded
     * 4. getModel() on the VirtualTreeItem returns the wrong model
     */
    testGetModelAfterCollapseExpand() {
      var root = new qx.test.ui.tree.virtual.Node("Root");

      // Create child nodes with names that make it clear which is which
      for (var i = 0; i < 5; i++) {
        var child = new qx.test.ui.tree.virtual.Node("Child " + i);
        // Add some sub-children to make them expandable
        for (var j = 0; j < 3; j++) {
          child.getChildren().push(
            new qx.test.ui.tree.virtual.Leaf("Child " + i + "." + j)
          );
        }
        root.getChildren().push(child);
      }

      this.tree.setLabelPath("name");
      this.tree.setChildProperty("children");
      this.tree.setModel(root);
      this.flush();

      // Get child item 3
      var child3 = root.getChildren().getItem(3);

      // Open child 3
      this.tree.openNode(child3);
      this.flush();

      // Get the widget for child 3 and verify model is correct
      var widget3 = this.__getWidgetForm(child3);
      this.assertNotNull(widget3, "Widget for child 3 should exist");
      this.assertEquals(
        child3,
        widget3.getModel(),
        "Model should be Child 3 after opening"
      );
      this.assertEquals(
        "Child 3",
        widget3.getModel().getName(),
        "Model name should be 'Child 3' after opening"
      );

      // Close child 3
      this.tree.closeNode(child3);
      this.flush();

      // Re-open child 3
      this.tree.openNode(child3);
      this.flush();

      // Get the widget again and check that getModel() returns the correct model
      widget3 = this.__getWidgetForm(child3);
      this.assertNotNull(widget3, "Widget for child 3 should exist after re-open");
      this.assertEquals(
        child3,
        widget3.getModel(),
        "Model should still be Child 3 after re-opening (Issue #10470)"
      );
      this.assertEquals(
        "Child 3",
        widget3.getModel().getName(),
        "Model name should be 'Child 3' after re-opening (Issue #10470)"
      );

      // Also test with event listeners to verify the model in callbacks
      var modelFromCallback = null;
      var labelFromCallback = null;

      // Add a listener that captures the model
      widget3.addListener("changeOpen", function(e) {
        modelFromCallback = this.getModel();
        if (modelFromCallback) {
          labelFromCallback = modelFromCallback.getName();
        }
      }, widget3);

      // Trigger a collapse
      this.tree.closeNode(child3);
      this.flush();

      // Verify the model in the callback was correct
      this.assertEquals(
        child3,
        modelFromCallback,
        "Model in callback should be Child 3"
      );
      this.assertEquals(
        "Child 3",
        labelFromCallback,
        "Model name in callback should be 'Child 3'"
      );

      // Clean up
      root.dispose();
    }
  }
});
