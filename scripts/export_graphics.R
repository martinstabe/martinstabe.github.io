source_url <- Sys.getenv("GRAPHICS_SOURCE_URL", unset = "")

if (source_url == "") {
  stop("GRAPHICS_SOURCE_URL is not set.", call. = FALSE)
}

json_escape <- function(value) {
  if (is.null(value) || is.na(value)) {
    return("")
  }

  value <- as.character(value)
  value <- gsub("\\\\", "\\\\\\\\", value)
  value <- gsub("\"", "\\\\\"", value)
  value <- gsub("\n", "\\\\n", value, fixed = TRUE)
  value <- gsub("\r", "\\\\r", value, fixed = TRUE)
  value <- gsub("\t", "\\\\t", value, fixed = TRUE)
  value
}

record_to_json <- function(record) {
  fields <- names(record)
  values <- vapply(record, json_escape, character(1))
  pairs <- paste0("\"", fields, "\":\"", values, "\"")
  paste0("{", paste(pairs, collapse = ","), "}")
}

tmp_path <- tempfile(fileext = ".rds")
download.file(source_url, tmp_path, quiet = TRUE, mode = "wb")
asset_db <- readRDS(tmp_path)

selected <- asset_db[!is.na(asset_db$flourish_author) & asset_db$flourish_author == "Martin Stabe", ]
selected$url <- paste0("https://www.ft.com/content/", selected$story)
selected$date <- selected$story_publishedDate
selected$flourish_img <- paste0(sub("/+$", "", selected$flourish_url), "/thumbnail")

output <- selected[, c(
  "story",
  "url",
  "story_title",
  "story_description",
  "story_link",
  "date",
  "type",
  "flourish_url",
  "flourish_id",
  "flourish_title",
  "flourish_date",
  "flourish_template",
  "flourish_img"
)]

output <- output[order(output$date), ]
records <- apply(output, 1, record_to_json)
cat("[", paste(records, collapse = ","), "]", sep = "")
