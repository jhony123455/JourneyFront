<script>
import setMaterialInput from "@/assets/js/material-input.js";
import { Field, ErrorMessage } from "vee-validate";

export default {
  name: "MaterialInputField",
  components: { Field, ErrorMessage },
  props: {
    variant: { type: String, default: "outline" },
    label: { type: String, default: "" },
    size: { type: String, default: "default" },
    success: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    name: { type: String, default: "" },
    id: { type: String, required: true },
    value: { type: String, default: "" },
    placeholder: { type: String, default: "" },
    type: { type: String, default: "text" },
    isRequired: { type: Boolean, default: false },
  },
  emits: ["update:value"],
  mounted() {
    setMaterialInput();
  },
  methods: {
    getClasses(size) {
      return size ? `form-control-${size}` : null;
    },
    getStatus(error, success) {
      if (success) return "is-valid";
      if (error) return "is-invalid";
      return null;
    },
  },
};
</script>


<template>
  <div
    class="input-group"
    :class="`input-group-${variant} ${getStatus(error, success)}`"
  >
    <label :for="id" :class="variant === 'static' ? '' : 'form-label'">{{ label }}</label>
    <Field
      :id="id"
      :type="type"
      class="form-control"
      :class="getClasses(size)"
      :name="name"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="isRequired"
      :value="value"
      @input="(e) => $emit('update:value', e.target.value)"
    />
  </div>
  <ErrorMessage :name="name" class="text-xs text-danger mt-1" as="div" />
</template>



<style scoped>
::v-deep(.form-control) {
  color: black !important;
}

::v-deep(label) {
  color: black !important;
}

::v-deep(.input-group-outline.is-focused .form-control),
::v-deep(.input-group-outline.focused .form-control),
::v-deep(.input-group-outline.is-focused label),
::v-deep(.input-group-outline.focused label) {
  color: black !important;
  box-shadow: 0 1px 0 0 black !important;
}

::v-deep(.form-control:focus) {
  box-shadow: 0 1px 0 0 black !important;
  border-color: black !important;
  background-image: linear-gradient(0deg, #000 2px, rgba(0, 0, 0, 0) 0),
  linear-gradient(0deg, #d2d2d2 1px, rgba(209, 209, 209, 0) 0) !important;
}
</style>
