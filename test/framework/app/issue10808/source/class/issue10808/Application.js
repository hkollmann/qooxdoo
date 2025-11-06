/**
 * This is the main application class for testing issue #10808
 *
 * Issue: In v8, the third argument (name) of qx.ui.form.Form.add() must be lowercase,
 * or it generates a binding error. This app demonstrates that the fix allows
 * capitalized names to work correctly.
 *
 * @asset(issue10808/*)
 */
qx.Class.define("issue10808.Application", {
  extend: qx.application.Standalone,

  members: {
    main: function() {
      this.base(arguments);

      if (qx.core.Environment.get("qx.debug")) {
        qx.log.appender.Native;
        qx.log.appender.Console;
      }

      var doc = this.getRoot();

      // Create a form
      var form = new qx.ui.form.Form();

      // Test 1: Add fields with capitalized names (the issue)
      var usernameField = new qx.ui.form.TextField();
      var emailField = new qx.ui.form.TextField();
      var passwordField = new qx.ui.form.PasswordField();

      // Before fix: These would fail because "Username", "EmailAddress", etc. are capitalized
      // After fix: These should work because the form automatically converts to lowercase
      form.add(usernameField, "Username", null, "Username");
      form.add(emailField, "Email Address", null, "EmailAddress");
      form.add(passwordField, "Password", null, "PassWord");

      // Test 2: Verify we can retrieve items using lowercase names
      var retrievedUsername = form.getItem("username");
      var retrievedEmail = form.getItem("emailaddress");
      var retrievedPassword = form.getItem("password");

      // Create a container for test results
      var container = new qx.ui.container.Composite(new qx.ui.layout.VBox(10));
      container.setPadding(20);

      // Title
      var title = new qx.ui.basic.Label("Issue #10808 Test: Form.add() name parameter");
      title.setFont("bold");
      container.add(title);

      // Test results
      var result1 = new qx.ui.basic.Label(
        "Test 1 - Add with capitalized names: " +
        (form.getItem("username") === usernameField ? "PASS ✓" : "FAIL ✗")
      );
      result1.setTextColor(retrievedUsername === usernameField ? "green" : "red");
      container.add(result1);

      var result2 = new qx.ui.basic.Label(
        "Test 2 - Retrieve 'EmailAddress' as 'emailaddress': " +
        (retrievedEmail === emailField ? "PASS ✓" : "FAIL ✗")
      );
      result2.setTextColor(retrievedEmail === emailField ? "green" : "red");
      container.add(result2);

      var result3 = new qx.ui.basic.Label(
        "Test 3 - Retrieve 'PassWord' as 'password': " +
        (retrievedPassword === passwordField ? "PASS ✓" : "FAIL ✗")
      );
      result3.setTextColor(retrievedPassword === passwordField ? "green" : "red");
      container.add(result3);

      // Test 4: Verify original capitalized names don't work (should be null)
      var shouldBeNull = form.getItem("Username");
      var result4 = new qx.ui.basic.Label(
        "Test 4 - Original capitalized name returns null: " +
        (shouldBeNull === null ? "PASS ✓" : "FAIL ✗")
      );
      result4.setTextColor(shouldBeNull === null ? "green" : "red");
      container.add(result4);

      // Test 5: Test with name generated from label
      var phoneField = new qx.ui.form.TextField();
      form.add(phoneField, "Phone Number"); // no explicit name, should be generated and lowercased
      var retrievedPhone = form.getItem("phonenumber");
      var result5 = new qx.ui.basic.Label(
        "Test 5 - Name from label 'Phone Number' -> 'phonenumber': " +
        (retrievedPhone === phoneField ? "PASS ✓" : "FAIL ✗")
      );
      result5.setTextColor(retrievedPhone === phoneField ? "green" : "red");
      container.add(result5);

      // Display the actual form
      container.add(new qx.ui.basic.Label("Actual Form:").set({
        font: "bold",
        marginTop: 20
      }));

      var renderer = new qx.ui.form.renderer.Single(form);
      container.add(renderer);

      // Add a button to test form data binding
      var testButton = new qx.ui.form.Button("Test Data Binding");
      testButton.addListener("execute", function() {
        var controller = new qx.data.controller.Form(null, form);
        var model = controller.createModel();

        // Set values using lowercase property names
        model.setUsername("testuser");
        model.setEmailaddress("test@example.com");
        model.setPassword("secret123");
        model.setPhonenumber("555-1234");

        this.info("Model data: " + JSON.stringify({
          username: model.getUserName(),
          emailaddress: model.getEmailAddress(),
          password: model.getPassword(),
          phonenumber: model.getPhoneNumber()
        }));

        alert("Data binding test complete! Check console for details.");
      }, this);
      container.add(testButton);

      doc.add(container, { left: 10, top: 10 });
    }
  }
});
