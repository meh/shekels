class Item < Lissio::Model
	adapter Lissio::Adapter::Storage

	property :name, primary: true
end
