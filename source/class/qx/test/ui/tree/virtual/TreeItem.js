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
     * 1. Items with children: null are configured with a changeOpen listener
     * 2. In the listener, this.getModel() is called to modify children
     * 3. After expand/collapse/re-expand, getModel() returns wrong model
     * 4. The wrong model gets modified instead of the correct one
     */
    testGetModelAfterCollapseExpand() {
      var root = new qx.test.ui.tree.virtual.Node("Root");
      root.getChildren().removeAll();

      // Create child nodes with children set to null initially
      // to simulate lazy loading scenario from the issue
      var child1 = new qx.test.ui.tree.virtual.Node("Child 1");
      child1.setChildren(null);
      var child2 = new qx.test.ui.tree.virtual.Node("Child 2");
      child2.setChildren(null);
      var child3 = new qx.test.ui.tree.virtual.Node("Child 3");
      child3.setChildren(null);

      root.getChildren().push(child1);
      root.getChildren().push(child2);
      root.getChildren().push(child3);

      // Track which models were modified
      var modifiedModels = [];

      // Set up delegate with configureItem that adds changeOpen listener
      this.tree.setDelegate({
        configureItem: function(item) {
          item.addListener("changeOpen", function(e) {
            if (e.getData() && this.getModel() && this.getModel().getChildren() === null) {
              // This is the key issue: this.getModel() returns wrong model
              var model = this.getModel();
              modifiedModels.push(model.getName());

              // Set children as would happen in real lazy-loading scenario
              model.setChildren(
                new qx.data.Array([
                  new qx.test.ui.tree.virtual.Leaf(model.getName() + ".1")
                ])
              );
            }
          });
        }
      });

      this.tree.setLabelPath("name");
      this.tree.setChildProperty("children");
      this.tree.setModel(root);
      this.flush();

      // Expand child 3 - should modify child3's children
      this.tree.openNode(child3);
      this.flush();

      // Verify child3 was modified (first expand)
      this.assertEquals(1, modifiedModels.length, "One model should have been modified");
      this.assertEquals("Child 3", modifiedModels[0], "Child 3 should have been modified");
      this.assertNotNull(child3.getChildren(), "Child 3 should have children after expand");
      this.assertEquals(1, child3.getChildren().getLength(), "Child 3 should have 1 child");

      // Reset for next test
      modifiedModels = [];

      // Close child 3
      this.tree.closeNode(child3);
      this.flush();

      // Reset children to null to simulate the scenario again
      child3.getChildren().removeAll();
      child3.getChildren().dispose();
      child3.setChildren(null);

      // Re-open child 3 - this is where the bug occurs
      this.tree.openNode(child3);
      this.flush();

      // BUG: After close/re-open, getModel() returns wrong model
      // The listener should modify child3, but might modify child2 or another item
      this.assertEquals(1, modifiedModels.length, "One model should have been modified on re-expand");
      this.assertEquals(
        "Child 3",
        modifiedModels[0],
        "Child 3 should have been modified (Issue #10470: getModel() returns wrong model)"
      );

      // Verify the correct model was modified
      this.assertNotNull(
        child3.getChildren(),
        "Child 3 should have children after re-expand (Issue #10470)"
      );

      // Verify wrong models were NOT modified
      this.assertNull(
        child1.getChildren(),
        "Child 1 should not have been modified"
      );
      this.assertNull(
        child2.getChildren(),
        "Child 2 should not have been modified (Issue #10470: wrong model modified)"
      );

      // Clean up
      root.dispose();
    }
  }
});
