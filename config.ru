require 'bundler'
Bundler.require

Opal::Processor.source_map_enabled = false

run Lissio::Server.new {|s|
	s.append_path 'app'
	s.append_path 'css'
	s.append_path 'js'

	s.index = 'index.html.erb'
	s.debug = true
}
